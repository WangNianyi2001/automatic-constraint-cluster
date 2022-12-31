# Automatic Constraint Network · 自动约束网络

这个库能够处理一组相互关联的变量，并且在修改其中某个的值时同步更改其余的值以满足约束。

详细原理见[我的博客](https://wangnianyi2001.github.io/automatic-constraint-network/)。

## 使用例

下面的例子展示了一个简单的温标转换器。
调整一种温标的数值时，其他温标的数值会随着变化。

```js
import { AutomaticConstraintCluster, RealVariable } from '../build/index.mjs';

// 创建一个约束网络
const cluster = new AutomaticConstraintCluster();

// 创建华氏度和摄氏度的变量
const fahrenheit = new RealVariable(32);
const celsius = new RealVariable(0);

// 在温标之间添加约束——损失函数
cluster.AddConstraint(fahrenheit, celsius, (f, c) => Math.abs(1.8 * c + 32 - f));

// 设置为 100 度
if(cluster.SetVariable(celsius, 100))
	console.log(`${celsius.value}°C == ${fahrenheit.value}°F`);
	// 100°C == 211.99000400838938°F
else
	console.warn('Assignment failed');
```
