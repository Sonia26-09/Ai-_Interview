import { wrapCode } from '../src/lib/codeWrapper';

const userCode = `class Solution:
    def twoSum(self, nums, target):
        seen = {}
        for i, n in enumerate(nums):
            if target - n in seen:
                return [seen[target - n], i]
            seen[n] = i`;

const result = wrapCode(userCode, 'python', 'twoSum', [
    {
        id: 'tc1', input: '', expectedOutput: '[0, 1]', isHidden: false,
        inputPython: 'nums = [2,7,11,15]\ntarget = 9',
        argsPython: 'nums, target',
    },
    {
        id: 'tc2', input: '', expectedOutput: '[1, 2]', isHidden: false,
        inputPython: 'nums = [3,2,4]\ntarget = 6',
        argsPython: 'nums, target',
    },
]);

console.log('=== GENERATED PYTHON CODE ===');
console.log(result);
