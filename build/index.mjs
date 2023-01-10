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
const defaultPropagatorConfig = {
    alpha: 1e-1,
    maxError: 1e-2,
    maxStepCount: 1e3
};
class VariableNode {
    name;
    variable;
    propagators = new Set();
    constructor(name, variable) {
        this.name = name;
        this.variable = variable;
    }
    Connect(target, Cost, config = defaultPropagatorConfig) {
        for (const propagator of this.propagators) {
            if (propagator.target === target)
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
    #nodes = new Map();
    AddVariable(name, variable) {
        if (this.#nodes.has(name))
            return false;
        this.#nodes.set(name, new VariableNode(name, variable));
        return true;
    }
    GetVariable(name) {
        if (!this.#nodes.has(name))
            return null;
        return this.#nodes.get(name);
    }
    AddConstraint(a, b, Cost, aToB, bToA) {
        if (a === b)
            return false;
        const aNode = this.GetVariable(a);
        const bNode = this.GetVariable(b);
        if (!aNode || !bNode)
            return false;
        return [
            aNode.Connect(bNode, (b) => Cost(aNode.variable.value, b), aToB),
            bNode.Connect(aNode, (a) => Cost(a, bNode.variable.value), bToA)
        ].reduce((a, b) => a && b, true);
    }
    #Propagate(propagator) {
        const { target: { variable }, Cost, config } = propagator;
        for (let stepCount = 0; stepCount < config.maxStepCount; ++stepCount) {
            const cost = Cost(variable.value);
            if (cost < config.maxError)
                return true;
            // Move along gradient
            const chart = variable.CreateChart();
            const currentVector = chart.ToVector(variable.value);
            const offset = chart.GradientAt(currentVector, config.alpha * cost, Cost);
            variable.value = chart.FromVector(currentVector.Plus(offset));
        }
        return false;
    }
    SetVariable(name, value) {
        const node = this.#nodes.get(name);
        if (!node)
            return false;
        node.variable.value = value;
        const propagated = new Set([node]);
        const wavefronts = new Set(node.propagators.values());
        while (wavefronts.size) {
            const wavefront = wavefronts.values().next().value;
            if (!this.#Propagate(wavefront))
                return false;
            propagated.add(wavefront.target);
            wavefronts.delete(wavefront);
            for (const next of wavefront.target.propagators.values()) {
                if (!propagated.has(next.target))
                    wavefronts.add(next);
            }
        }
        return true;
    }
}
