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
export declare class AutomaticConstraintCluster {
    #private;
    AddVariable<V>(variable: Variable<V>): boolean;
    AddConstraint<A, B>(aVar: Variable<A>, bVar: Variable<B>, Cost: (a: A, b: B) => number): boolean;
    SetVariable<V>(variable: Variable<V>, value: V, alpha?: number, maxError?: number, maxStep?: number): boolean;
}
