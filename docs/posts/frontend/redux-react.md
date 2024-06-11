# Redux
## 介绍
Redux 是 JavaScript 应用的状态容器，提供可预测的状态管理。就是一个函数式的状态管理器。
主要有以下几个特点：
1. 单一数据源
2. 状态不可变性
3. 纯函数，没有副作用
4. 单向数据流 （单一数据源以及单向数据流使其的数据具备可预测性）


## 简单使用
-  创建一个store
```
import {createStore} from 'redux'

const store = createStore(reducerName)

export default store
```
- 创建store的修改规则，也就是reducer
```
/**
state 需要管理的store
action 传递的数据
**/
const reducer = (state, action) => {
	switch (action.type) {
		case 'ADD':
		state += 1
		break;
		case 'MIN':
		state -= 1
		break;
		default:
		return state;	
	}	  
	// 最后记得返回
	return state
}
```
- 使用 store
```
import store from './store'



// 记得订阅数据变化
componentDidMount () {
	this.forceUpdate()
}

add = () => {
	store.dispatch({type: 'ADD'})
}

min = () => {
	store.dispatch({type: 'MIN'})
}
render () {
	return (
		<div> store.getState()</div>
		<button onClick={this.add}>add</button>
		<button onClick={this.min}>min</button>
	)
}
```


## 常用Api
- createStore
- applyMiddleware
- combineReducers

## 原理
利用函数式编程做统一状态管理，实现单向数据流，使数据的流转变得可预测。

## 实现简单的redux

使用redux的两个关键Api就是：

- createStore
- applyMiddleware

在实现createStore一级applyMiddleware之前我们先来了解一下中间件。

### 中间件
Redux 的中间件提供的是位于 action 被发起之后，到达 reducer 之前的扩展点，换而言之，原本 view -> action -> reducer -> store 的数据流加上中间件后变成了 view -> action -> middleware -> reducer -> store ，在这一环节可以做一些"副作用"的操作，如 异步请求、打印日志等。

我们先看看如何使用：
```
// 使用
import {createStore,applyMiddleware} from 'redux'

const reducer = (state, action) => {
	switch (action.type) {
		case 'ADD':
		state += 1
		break;
		case 'MIN':
		state -= 1
		break;
		default:
		return state;	
	}	  
	// 最后记得返回
	return state
}
// middles一些中间件
const middlewares = applyMiddleware(...middles)
//preloadedState 默认值
const store = createStore(reducer,preloadedState,middlwares)

export default store
```


#### 中间件怎么写

```
import isPromsie from 'is-promise'
// 日志打印
function logger({getState,dispatch}) {
	return next => action =>{  
		console.log('will dispatch', action)  
		  
		// Call the next dispatch method in the middleware chain.  
		const returnValue = next(action)  
		// 打印修改之后的state值
		console.log('state after dispatch', getState())  
		  
		// This will likely be the action itself, unless  
		// a middleware further in chain changed it.  
		return returnValue
	}
}
// 让dispatch支持promise
function supportPromise ((getState,dispatch)) {
	return next => action => {
		// 这里只需要检查一下action是否是promise即可,不是的话直接执行即可
		return isPromsie(action)?action.then(dispatch):next(action)
	}
}


```



### createStore如何实现
先看createStore返回了什么内容
```
主要是以下几个方法
{
	dispatch,
	subscribe,
	getState
}
```

实现自定义createStore

```
// reducer 修改规则
// preloadedState 默认值
// enhancer 存储增强器。您可以选择指定它来通过第三方功能（例如中间件、时间旅行、持久性等）增强 存储。Redux 附带的唯一存储增强器是。 [`applyMiddleware()`]

function createStore(reducer,preloadedState,enhancer) {
	// 如果有增强器那就直接执行增强器
	if (enhancer) {
		// enhancer加强dispatch
		return enhancer(createStore)(reducer);
	}

	let currentState;
	let listeners = []
	
	// 派发事件
	const dispatch = (action) => {
		currentState = reducer(currentState,action)
		//然后通知所有事件
		listeners.map(listener => listener())
	}
	// 监听事件
	const subscribe = (listener) => {
		let len = listeners.push(listener)
		return () => {
			const index = len - 1
			listeners.splice(index,1)
		}
	}
	// 返回当前store的store
	const getState = () => {
		return currentState
	}

	return {
		dispatch,
		subscribe,
		getState
	}
}
```




### applyMiddleware如何实现
了解了中间件是怎么实现加上如何使用applyMiddleware应用中间件，那我们就知道applyMiddleware大概是需要什么参数以及返回什么了。

首先applyMiddleware组合了中间件之后返回增强器给到了createStore里面去使用能知道它返回的是一个接受next(createStore)参数的函数，该函数又是返回一个接受action得函数：“enhancer(createStore)(reducer)”,最后函数应该返回与createStore返回一样的结果，只是给dispatch包装了一些中间件的执行，变成了一个高级的dispatch。

所以applyMiddleware的基本结构就是
```javascript
function applyMiddleware(...middlewares) {
	return (createStore) => (reducer) => {
		let store = createStore(resucer)
		
		return {
			...store
		}
	}
}
```

接下来就是对store的dispatch进行重新封装。从实现中间件的方法中可以知道，中间件默认是接受({getState, dispatch})参数的。所以我们先把dispatch包装起来
```javascript
function applyMiddleware(...middlewares) {
	return (createStore) => (reducer) => {
		let store = createStore(resucer)
		let midApi = {
			getState: store.getState,
			
			dispatch: (action,...args) => store.dispatch(action,...args)
		}
		// 遍历所有的中间件把midApi给进去每个中间件
		let middlewareChain = middlewares.map(middleware => middleware(midApi))
		// 得到的是中间件的执行函数数组
		// [
		//	(next) => (action) => {
		//	}
		//]
		// 下一步就是在执行dispatch的时候把所有中间件都按照顺序执行一次，真正变成一个高级dispatch
		//这里就利用到组合函数的概念，
		// 这里最后还需要调用一次并给 store.dispatch是因为第一个调用的中间件函数需要接受一个next（也就是dispatch），而之后接受的都是上一个中间件函数执行返回的一个函数,也就是(action) => {} 	
		// 所以 dispatch 也是接受 action的函数，因为中间件最后一个返回的函数是(action) => {}
		let dispatch = compose(...middlewareChain)(store.dispatch)
		return {
			...store,
			dispatch
		}
	}
}

// 组合执行就是按照顺序依次执行一些方法
// 利用reduce方法，把上一次执行的结果给到下一次执行
// 由于middleware每次执行都是返回一个接受 action的函数
// 所以在 middleware中的next就是上一次中间件待执行的函数
function compose(...funcs) {
	if (funcs.length === 0) {
	
		return (arg) => arg
	}
	
	if (funcs.length === 1) {
		return funcs[0]
	}
	return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
```


#### 组合函数
再了解一下applyMiddleware里面使用到的compose函数（组合函数）。

将多个函数按照一定顺序组合起来，以便将一个函数的输出作为另一个函数的输入，这就是函数的组合。

```
function compose(...funcs) {
	if (funcs.length === 0) {
		return (arg) => arg
	}
	if (funcs.length === 1) {
		return funcs[0]
	}
	return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
```

例如：
```
function fn1(...args) {

    console.log('fn1',...args)
    return 1
}
function fn2(...args) {

    console.log('fn2',...args)
    return 2
}
function fn3(...args) {

    console.log('fn3',...args)
    return 3
}
compose(fn1,fn2,fn3)(0)
输出：=>
fn3 0
fn2 3
fn1 2
1
```

