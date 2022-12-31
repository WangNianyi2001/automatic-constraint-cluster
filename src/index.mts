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

class VariableNode<V> {
	readonly variable: Variable<V>;
	readonly adjacency = new Map<VariableNode<any>, CostFunction<V>>();

	constructor(variable: Variable<V>) {
		this.variable = variable;
	}
	Connect(node: VariableNode<any>, Cost: CostFunction<V>): boolean {
		if(this.adjacency.has(node))
			return false;
		this.adjacency.set(node, Cost);
		return true;
	}
}

export class AutomaticConstraintCluster {
	#nodes = new Map<Variable<any>, VariableNode<any>>();

	AddVariable<V>(variable: Variable<V>): boolean {
		if(this.#nodes.has(variable))
			return false;
		this.#nodes.set(variable, new VariableNode(variable));
		return true;
	}
	AddConstraint<A, B>(aVar: Variable<A>, bVar: Variable<B>, Cost: (a: A, b: B) => number): boolean {
		this.#nodes.has(aVar) || this.AddVariable(aVar);
		this.#nodes.has(bVar) || this.AddVariable(bVar);
		const [aNode, bNode] = [aVar, bVar].map(v => this.#nodes.get(v));
		let connection = true;
		connection = connection && aNode.Connect(bNode, (b: B) => Cost(aNode.variable.value, b));
		connection = connection && bNode.Connect(aNode, (a: A) => Cost(a, bNode.variable.value));
		return connection;
	}

	SetVariable<V>(
		variable: Variable<V>, value: V,
		alpha: number = 1e-1, maxError: number = 1e-2, maxStep: number = 1e3
	): boolean {
		const node = this.#nodes.get(variable);
		if(!node)
			return false;
		// TODO: traverse through whole graph
		variable.value = value;
		for(const [{ variable: neighbour }, Cost] of node.adjacency.entries()) {
			let success = false;
			// Single step of gradient descent
			for(let step = 0; step < maxStep; ++step) {
				const currentCost = Cost(neighbour.value);
				if(currentCost < maxError) {
					success = true;
					break;
				}
				// Move neighbour along gradient
				const chart = neighbour.CreateChart();
				const currentVector = chart.ToVector(neighbour.value);
				const offset = chart.GradientAt(currentVector, alpha * currentCost, Cost);
				neighbour.value = chart.FromVector(currentVector.Plus(offset) as RealVector);
			}
			if(!success)
				return false;
		}
		return true;
	}
}
