import {} from '@nianyi-wang/vector';
import { AutomaticConstraintCluster, RealVariable } from '../build/index.mjs';

const cluster = new AutomaticConstraintCluster();

const fahrenheit = new RealVariable(32);
cluster.AddVariable('fahrenheit', fahrenheit);
const celsius = new RealVariable(0);
cluster.AddVariable('celsius', celsius);

cluster.AddConstraint('fahrenheit', 'celsius', (f: number, c: number) => Math.abs(1.8 * c + 32 - f));

console.log(cluster.SetVariable('celsius', 100));
console.log(celsius.value);
console.log(fahrenheit.value);
