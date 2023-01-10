import { AutomaticConstraintCluster, RealVariable } from '../build/index.mjs';

const cluster = new AutomaticConstraintCluster();

const kelvin = new RealVariable(0);
cluster.AddVariable('kelvin', kelvin);
const fahrenheit = new RealVariable(0);
cluster.AddVariable('fahrenheit', fahrenheit);
const celsius = new RealVariable(0);
cluster.AddVariable('celsius', celsius);

cluster.AddConstraint('fahrenheit', 'celsius', (f, c) => Math.abs(1.8 * c + 32 - f));
cluster.AddConstraint('kelvin', 'celsius', (k, c) => Math.abs(k - 273 - c));

if(!cluster.SetVariable('fahrenheit', 32)) {
	console.error('Failed to set variable');
}
else {
	console.log(`${kelvin.value}K = ${celsius.value}C = ${fahrenheit.value}F`);
}
