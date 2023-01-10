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
    readonly cluster: AutomaticConstraintCluster;
    readonly name: string;
    readonly variable: Variable<V>;
    readonly propagators: Set<Propagator<any>>;
    get value(): V;
    set value(value: V);
    constructor(cluster: AutomaticConstraintCluster, name: string, variable: Variable<V>);
    Connect<_V>(target: VariableNode<_V>, Cost: CostFunction<_V>, config?: PropagatorConfig): boolean;
}
export declare class AutomaticConstraintCluster {
    #private;
    AddVariable<V>(name: string, variable: Variable<V>): VariableNode<V> | null;
    FindVariable<V>(name: string | VariableNode<V>): VariableNode<V> | null;
    AddConstraint<A, B>(a: string | VariableNode<A>, b: string | VariableNode<B>, Cost: (a: A, b: B) => number, aToB?: PropagatorConfig, bToA?: PropagatorConfig): boolean;
    SetValue<V>(target: string | VariableNode<V>, value: V): boolean;
}
export {};
