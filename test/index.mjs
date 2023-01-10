import { AutomaticConstraintCluster, RealVariable } from '../build/index.mjs';

const cluster = new AutomaticConstraintCluster();

const kelvin = cluster.AddVariable('kelvin', new RealVariable(0));
const fahrenheit = cluster.AddVariable('fahrenheit', new RealVariable(0));
const celsius = cluster.AddVariable('celsius', new RealVariable(0));

cluster.AddConstraint(fahrenheit, celsius, (f, c) => Math.abs(1.8 * c + 32 - f));
cluster.AddConstraint(kelvin, celsius, (k, c) => Math.abs(k - 273 - c));

if(!cluster.SetValue(fahrenheit, 32))
	console.error('Failed to set variable');
else
	console.log(`${kelvin.value}K = ${celsius.value}C = ${fahrenheit.value}F`);
