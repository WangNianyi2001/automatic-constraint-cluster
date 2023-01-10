import { RealVector } from '@nianyi-wang/vector';
export type CostFunction<V> = (v: V) => number;
export declare abstract class Chart<V> {
    abstract ToVector(value: V): RealVector;
    abstract FromVector(vector: RealVector): V;
    SampleAround(center: RealVector, distance: number): RealVector[];
    GradientAt(center: RealVector, distance: number, Cost: CostFunction<V>): RealVector;
}
export interface Variable<V> {
    value: V;
    CreateChart(): Chart<V>;
}
export declare class RealVariable extends Chart<number> implements Variable<number> {
    value: number;
    constructor(value: number);
    ToVector(value: number): RealVector;
    FromVector(vector: RealVector): number;
    CreateChart(): Chart<number>;
}
export declare interface PropagatorConfig {
    alpha: number;
    maxError: number;
    maxStepCount: number;
}
export declare interface Propagator<V> {
    target: VariableNode<V>;
    Cost: CostFunction<V>;
    config: PropagatorConfig;
}
declare class VariableNode<V> {
    readonly name: string;
    readonly variable: Variable<V>;
    readonly propagators: Set<Propagator<any>>;
    constructor(name: string, variable: Variable<V>);
    Connect<_V>(target: VariableNode<_V>, Cost: CostFunction<_V>, config?: PropagatorConfig): boolean;
}
export declare class AutomaticConstraintCluster {
    #private;
    AddVariable<V>(name: string, variable: Variable<V>): boolean;
    GetVariable<V>(name: string): VariableNode<V> | null;
    AddConstraint<A, B>(a: string, b: string, Cost: (a: A, b: B) => number, aToB?: PropagatorConfig, bToA?: PropagatorConfig): boolean;
    SetVariable<V>(name: string, value: V): boolean;
}
export {};
