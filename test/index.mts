import { AutomaticConstraintCluster, RealVariable } from '../build/index.mjs';

const cluster = new AutomaticConstraintCluster();

const fahrenheit = new RealVariable(32);
const celsius = new RealVariable(0);

cluster.AddConstraint(fahrenheit, celsius, (f, c) => Math.abs(1.8 * c + 32 - f));

if(cluster.SetVariable(celsius, 100))
	console.log(`${celsius.value}°C == ${fahrenheit.value}°F`);
else
	console.warn('Assignment failed');
