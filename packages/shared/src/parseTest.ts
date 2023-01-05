// 有限状态机和正则的关系 /abc/.test()  /ab[cd]/.test() 
// 闭包实现
function testReg(str) {
    let i;
    let startIndex;
    let endIndex;
    let result:any = [];
    function waitForA(char) {
        if(char === 'a') {
            startIndex = i;
            return waitForB
        }
        return waitForA
    }
    function waitForB(char) {
        if(char === 'b') {
            return waitForC
        }
        return waitForB
    }
    function waitForC(char) {
        if (char === 'c' || char === 'd') {
            endIndex = i;
            return end
        }
        return waitForA // 从头开始
    }
    function end() {
        return end
    }

    let currentState = waitForA
    for (i = 0; i < str.length; i++) {
        const nextState = currentState(str[i]);
        currentState = nextState;
        if (currentState === end) {
            // return true
            console.log(startIndex, endIndex);
            result.push({
                start: startIndex, 
                end: endIndex
            })
            // 重置
            currentState = waitForA
            
        }
    }
    // return false
}

console.log(testReg('abc哈哈哈哈abnnncabc,,abd'));
