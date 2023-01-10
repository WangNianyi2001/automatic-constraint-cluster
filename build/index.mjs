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
    cluster;
    name;
    variable;
    propagators = new Set();
    get value() {
        return this.variable.value;
    }
    set value(value) {
        this.cluster.SetValue(this, value);
    }
    constructor(cluster, name, variable) {
        this.cluster = cluster;
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
            return null;
        const node = new VariableNode(this, name, variable);
        this.#nodes.set(name, node);
        return node;
    }
    FindVariable(name) {
        if (name instanceof VariableNode) {
            if (this.#nodes.get(name.name) !== name)
                return null;
            return name;
        }
        else {
            if (!this.#nodes.has(name))
                return null;
            return this.#nodes.get(name);
        }
    }
    AddConstraint(a, b, Cost, aToB, bToA) {
        a = this.FindVariable(a);
        b = this.FindVariable(b);
        if (!a || !b)
            return false;
        if (a === b)
            return false;
        const aNode = a, bNode = b;
        return [
            aNode.Connect(b, (b) => Cost(aNode.variable.value, b), aToB),
            bNode.Connect(a, (a) => Cost(a, bNode.variable.value), bToA)
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
    SetValue(target, value) {
        target = this.FindVariable(target);
        if (!target)
            return false;
        target.variable.value = value;
        const propagated = new Set([target]);
        const wavefronts = new Set(target.propagators.values());
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
