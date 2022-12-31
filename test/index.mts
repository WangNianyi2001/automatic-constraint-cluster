import {} from '@nianyi-wang/vector';
import { AutomaticConstraintCluster, RealVariable } from '../build/index.mjs';

const cluster = new AutomaticConstraintCluster();

const fahrenheit = new RealVariable(32);
const celsius = new RealVariable(0);

cluster.AddConstraint(fahrenheit, celsius, (f, c) => Math.abs(1.8 * c + 32 - f));

console.log(cluster.SetVariable(celsius, 100, .5, 1e-3, 1e3));
console.log(celsius.value);
console.log(fahrenheit.value);
