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
	from: VariableNode<V>;
	to: VariableNode<V>;
	Cost: CostFunction<V>;
	config: PropagatorConfig;
}

class VariableNode<V> {
	readonly name: string;
	readonly variable: Variable<V>;
	readonly propagators = new Map<VariableNode<any>, Propagator<V>>();

	constructor(name: string, variable: Variable<V>) {
		this.name = name;
		this.variable = variable;
	}
	Connect(node: VariableNode<any>, Cost: CostFunction<V>, config: PropagatorConfig = defaultPropagatorConfig): boolean {
		if(this.propagators.has(node))
			return false;
		this.propagators.set(node, {
			from: this,
			to: node,
			Cost,
			config
		});
		return true;
	}
}

export class AutomaticConstraintCluster {
	#nodes = new Map<string, VariableNode<any>>();

	AddVariable<V>(name: string, variable: Variable<V>): boolean {
		if(this.#nodes.has(name))
			return false;
		this.#nodes.set(name, new VariableNode(name, variable));
		return true;
	}
	AddConstraint<A, B>(
		a: string, b: string,
		Cost: (a: A, b: B) => number,
		aToB?: PropagatorConfig,
		bToA?: PropagatorConfig,
	): boolean {
		if(a === b)
			return false;
		if([a, b].some(name => !this.#nodes.has(name)))
			return false;
		const [aNode, bNode] = [a, b].map(v => this.#nodes.get(v));
		return [
			aNode.Connect(bNode, (b: B) => Cost(aNode.variable.value, b), aToB),
			bNode.Connect(aNode, (a: A) => Cost(a, bNode.variable.value), bToA)
		].reduce((a, b) => a && b, true);
	}

	#Propagate(propagator: Propagator<any>) {
		const { to: { variable }, Cost, config } = propagator;
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
	SetVariable<V>(name: string, value: V): boolean {
		const node = this.#nodes.get(name);
		if(!node)
			return false;
		node.variable.value = value;
		const propagated = new Set<VariableNode<any>>([node]);
		const wavefronts = new Set<Propagator<any>>(node.propagators.values());
		while(wavefronts.size) {
			const wavefront = wavefronts.values().next().value as Propagator<any>;
			if(!this.#Propagate(wavefront))
				return false;
			propagated.add(wavefront.to);
			wavefronts.delete(wavefront);
			for(const next of wavefront.to.propagators.values()) {
				if(!propagated.has(next.to))
					wavefronts.add(next);
			}
		}
		return true;
	}
}
