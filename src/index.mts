import { RealNumber, RealVector } from '@nianyi-wang/vector';

export type CostFunction<V> = (v: V) => number;

export abstract class Chart<V> {
	abstract ToVector(value: V): RealVector;
	abstract FromVector(vector: RealVector): V;
	SampleAround(center: RealVector, distance: number): RealVector[] {
		const dimension = center.dimension;
		const samples: RealVector[] = Array(dimension);
		for(let i = 0; i < dimension; ++i) {
			const offset = Array(dimension).fill(0);
			offset[i] = distance;
			samples[i] = new RealVector(offset).Plus(center) as RealVector;
		}
		return samples;
	}
	GradientAt(center: RealVector, distance: number, Cost: CostFunction<V>): RealVector {
		const samples = this.SampleAround(center, distance);
		let gradient = new RealVector(Array(center.dimension).fill(0));
		const centerCost = Cost(this.FromVector(center));
		for(const sample of samples) {
			const cost = Cost(this.FromVector(sample));
			const weight = cost - centerCost;
			gradient = gradient.Minus(sample.Minus(center).Scale(new RealNumber(weight))) as RealVector;
		}
		return gradient.Scale(1 / distance) as RealVector;
	}
}

export interface Variable<V> {
	value: V;
	CreateChart(): Chart<V>;
}

export class RealVariable extends Chart<number> implements Variable<number> {
	value: number;

	constructor(value: number) {
		super();
		this.value = value;
	}

	ToVector(value: number): RealVector {
		return new RealVector([value]);
	}
	FromVector(vector: RealVector): number {
		return vector.At(0).valueOf();
	}

	CreateChart(): Chart<number> {
		return this;
	}
}

export declare interface PropagatorConfig {
	alpha: number;
	maxError: number;
	maxStepCount: number;
}

const defaultPropagatorConfig: PropagatorConfig = {
	alpha: 1e-1,
	maxError: 1e-2,
	maxStepCount: 1e3
};

export declare interface Propagator<V> {
	target: VariableNode<V>;
	Cost: CostFunction<V>;
	config: PropagatorConfig;
}

class VariableNode<V> {
	readonly cluster: AutomaticConstraintCluster;
	readonly name: string;
	readonly variable: Variable<V>;
	readonly propagators = new Set<Propagator<any>>();

	get value(): V {
		return this.variable.value;
	}
	set value(value: V) {
		this.cluster.SetValue(this, value);
	}

	constructor(cluster: AutomaticConstraintCluster, name: string, variable: Variable<V>) {
		this.cluster = cluster;
		this.name = name;
		this.variable = variable;
	}
	Connect<_V>(target: VariableNode<_V>, Cost: CostFunction<_V>, config: PropagatorConfig = defaultPropagatorConfig): boolean {
		for(const propagator of this.propagators) {
			if(propagator.target === target)
				return false;
		}
		this.propagators.add({
			target,
			Cost,
			config
		});
		return true;
	}
}

export class AutomaticConstraintCluster {
	#nodes = new Map<string, VariableNode<any>>();

	AddVariable<V>(name: string, variable: Variable<V>): VariableNode<V> | null {
		if(this.#nodes.has(name))
			return null;
		const node = new VariableNode(this, name, variable);
		this.#nodes.set(name, node);
		return node;
	}
	FindVariable<V>(name: string | VariableNode<V>): VariableNode<V> | null {
		if(name instanceof VariableNode) {
			if(this.#nodes.get(name.name) !== name)
				return null;
			return name;
		}
		else {
			if(!this.#nodes.has(name))
				return null;
			return this.#nodes.get(name)!;
		}
	}
	AddConstraint<A, B>(
		a: string | VariableNode<A>, b: string | VariableNode<B>,
		Cost: (a: A, b: B) => number,
		aToB?: PropagatorConfig,
		bToA?: PropagatorConfig,
	): boolean {
		a = this.FindVariable<A>(a);
		b = this.FindVariable<B>(b);
		if(!a || !b)
			return false;
		if(a as VariableNode<any> === b as VariableNode<any>)
			return false;
		const aNode = a, bNode = b;
		return [
			aNode.Connect(b, (b: B) => Cost(aNode.variable.value, b), aToB),
			bNode.Connect(a, (a: A) => Cost(a, bNode.variable.value), bToA)
		].reduce((a, b) => a && b, true);
	}

	#Propagate(propagator: Propagator<any>) {
		const { target: { variable }, Cost, config } = propagator;
		for(let stepCount = 0; stepCount < config.maxStepCount; ++stepCount) {
			const cost = Cost(variable.value);
			if(cost < config.maxError)
				return true;
			// Move along gradient
			const chart = variable.CreateChart();
			const currentVector = chart.ToVector(variable.value);
			const offset = chart.GradientAt(currentVector, config.alpha * cost, Cost);
			variable.value = chart.FromVector(currentVector.Plus(offset) as RealVector);
		}
		return false;
	}
	SetValue<V>(target: string | VariableNode<V>, value: V): boolean {
		target = this.FindVariable(target);
		if(!target)
			return false;
		target.variable.value = value;
		const propagated = new Set<VariableNode<any>>([target]);
		const wavefronts = new Set<Propagator<any>>(target.propagators.values());
		while(wavefronts.size) {
			const wavefront = wavefronts.values().next().value as Propagator<any>;
			if(!this.#Propagate(wavefront))
				return false;
			propagated.add(wavefront.target);
			wavefronts.delete(wavefront);
			for(const next of wavefront.target.propagators.values()) {
				if(!propagated.has(next.target))
					wavefronts.add(next);
			}
		}
		return true;
	}
}
