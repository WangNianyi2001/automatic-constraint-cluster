import { RealNumber, RealVector } from '@nianyi-wang/vector';
export class Chart {
    SampleAround(center, distance) {
        const dimension = center.dimension;
        const samples = Array(dimension);
        for (let i = 0; i < dimension; ++i) {
            const offset = Array(dimension).fill(0);
            offset[i] = distance;
            samples[i] = new RealVector(offset).Plus(center);
        }
        return samples;
    }
    GradientAt(center, distance, Cost) {
        const samples = this.SampleAround(center, distance);
        let gradient = new RealVector(Array(center.dimension).fill(0));
        const centerCost = Cost(this.FromVector(center));
        for (const sample of samples) {
            const cost = Cost(this.FromVector(sample));
            const weight = cost - centerCost;
            gradient = gradient.Minus(sample.Minus(center).Scale(new RealNumber(weight)));
        }
        return gradient.Scale(1 / distance);
    }
}
export class RealVariable extends Chart {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
    ToVector(value) {
        return new RealVector([value]);
    }
    FromVector(vector) {
        return vector.At(0).valueOf();
    }
    CreateChart() {
        return this;
    }
}
class VariableNode {
    variable;
    adjacency = new Map();
    constructor(variable) {
        this.variable = variable;
    }
    Connect(node, Cost) {
        if (this.adjacency.has(node))
            return false;
        this.adjacency.set(node, Cost);
        return true;
    }
}
export class AutomaticConstraintCluster {
    #nodes = new Map();
    AddVariable(variable) {
        if (this.#nodes.has(variable))
            return false;
        this.#nodes.set(variable, new VariableNode(variable));
        return true;
    }
    AddConstraint(aVar, bVar, Cost) {
        this.#nodes.has(aVar) || this.AddVariable(aVar);
        this.#nodes.has(bVar) || this.AddVariable(bVar);
        const [aNode, bNode] = [aVar, bVar].map(v => this.#nodes.get(v));
        let connection = true;
        connection = connection && aNode.Connect(bNode, (b) => Cost(aNode.variable.value, b));
        connection = connection && bNode.Connect(aNode, (a) => Cost(a, bNode.variable.value));
        return connection;
    }
    SetVariable(variable, value, alpha = 1e-1, maxError = 1e-2, maxStep = 1e2) {
        const node = this.#nodes.get(variable);
        if (!node)
            return false;
        // TODO: traverse through whole graph
        variable.value = value;
        for (const [{ variable: neighbour }, Cost] of node.adjacency.entries()) {
            let success = false;
            // Single step of gradient descent
            for (let step = 0; step < maxStep; ++step) {
                const currentCost = Cost(neighbour.value);
                if (currentCost < maxError) {
                    success = true;
                    break;
                }
                // Move neighbour along gradient
                const chart = neighbour.CreateChart();
                const currentVector = chart.ToVector(neighbour.value);
                const offset = chart.GradientAt(currentVector, alpha * currentCost, Cost);
                neighbour.value = chart.FromVector(currentVector.Plus(offset));
            }
            if (!success)
                return false;
        }
        return true;
    }
}
