# Automatic Constraint Network · 自动约束网络

这个库能够处理一组相互关联的变量，并且在修改其中某个的值时同步更改其余的值以满足约束。

详细原理见[我的博客](https://wangnianyi2001.github.io/blog/automatic-constraint-network/)。

## 安装方式

```shell
$ npm i @nianyi-wang/automatic-constraint-cluster
```

## 使用例

下面的例子展示了一个简单的温标转换器。
调整一种温标的数值时，其他温标的数值会随着变化。

```js
import { AutomaticConstraintCluster, RealVariable } from '@nianyi-wang/automatic-constraint-cluster';

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

```
