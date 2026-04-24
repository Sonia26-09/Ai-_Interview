// ─────────────────────────────────────────────────────────────────────────────
// LeetCode-style code wrapper.
// Wraps the user's solution function with a main() + test runner so it
// compiles and runs with test-case verification.
// ─────────────────────────────────────────────────────────────────────────────

import { TestCase } from './types';

/**
 * Wrap user code with test runner for the given language.
 * Returns complete, runnable source code.
 */
export function wrapCode(
    userCode: string,
    language: string,
    functionName: string,
    testCases: TestCase[],
): string {
    switch (language.toLowerCase()) {
        case 'cpp': return wrapCpp(userCode, functionName, testCases);
        case 'c': return wrapCpp(userCode, functionName, testCases); // C uses same wrapper
        case 'java': return wrapJava(userCode, functionName, testCases);
        case 'python': return wrapPython(userCode, functionName, testCases);
        case 'javascript': return wrapJavaScript(userCode, functionName, testCases);
        case 'typescript': return wrapJavaScript(userCode, functionName, testCases);
        default: return userCode; // unsupported — run raw
    }
}

// ── C++ ──────────────────────────────────────────────────────────────────────

function wrapCpp(userCode: string, fn: string, testCases: TestCase[]): string {
    const tests = testCases.map((tc, i) => {
        const inputCode = tc.inputCpp || '';
        const args = tc.argsCpp || '';
        const expected = tc.expectedOutput;
        return `
    { // Test Case ${i + 1}
        ${inputCode}
        auto __result = sol.${fn}(${args});
        string __expected = "${escStr(expected)}";
        string __got = __toString(__result);
        if (__got == __expected) {
            cout << "Test Case ${i + 1}: PASSED ✓" << endl;
            __passed++;
        } else {
            cout << "Test Case ${i + 1}: FAILED ✗" << endl;
            cout << "  Expected: " << __expected << endl;
            cout << "  Got:      " << __got << endl;
        }
        __total++;
    }`;
    }).join('\n');

    return `#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <set>
#include <algorithm>
#include <stack>
#include <queue>
#include <sstream>
#include <climits>
#include <numeric>
using namespace std;

// ── Helpers ──
template<typename T>
string __toString(const vector<T>& v) {
    string s = "[";
    for (size_t i = 0; i < v.size(); i++) {
        s += to_string(v[i]);
        if (i < v.size()-1) s += ",";
    }
    return s + "]";
}
string __toString(int v) { return to_string(v); }
string __toString(long long v) { return to_string(v); }
string __toString(bool v) { return v ? "true" : "false"; }
string __toString(const string& v) { return v; }
string __toString(double v) { return to_string(v); }

// ── User Code ──
${userCode}

int main() {
    Solution sol;
    int __passed = 0, __total = 0;
${tests}
    cout << endl << __passed << "/" << __total << " test cases passed." << endl;
    return 0;
}
`;
}

// ── Java ─────────────────────────────────────────────────────────────────────

function wrapJava(userCode: string, fn: string, testCases: TestCase[]): string {
    const tests = testCases.map((tc, i) => {
        const inputCode = tc.inputJava || '';
        const args = tc.argsJava || '';
        const expected = tc.expectedOutput;
        return `
            { // Test Case ${i + 1}
                try {
                    ${inputCode}
                    Object __result = sol.${fn}(${args});
                    String __expected = "${escStr(expected)}";
                    String __got = __toString(__result);
                    if (__got.equals(__expected)) {
                        System.out.println("Test Case ${i + 1}: PASSED ✓");
                        __passed[0]++;
                    } else {
                        System.out.println("Test Case ${i + 1}: FAILED ✗");
                        System.out.println("  Expected: " + __expected);
                        System.out.println("  Got:      " + __got);
                    }
                } catch(Exception e) {
                    System.out.println("Test Case ${i + 1}: ERROR - " + e.getMessage());
                }
                __total[0]++;
            }`;
    }).join('\n');

    return `import java.util.*;

// ── User Code ──
${userCode}

class Main {
    static String __toString(Object o) {
        if (o instanceof int[]) return Arrays.toString((int[])o).replace(" ","");
        if (o instanceof long[]) return Arrays.toString((long[])o).replace(" ","");
        if (o instanceof String[]) return Arrays.toString((String[])o).replace(" ","");
        if (o instanceof boolean[]) return Arrays.toString((boolean[])o).replace(" ","");
        if (o instanceof List) return o.toString().replace(" ","");
        return String.valueOf(o);
    }

    public static void main(String[] args) {
        Solution sol = new Solution();
        int[] __passed = {0}, __total = {0};
${tests}
        System.out.println();
        System.out.println(__passed[0] + "/" + __total[0] + " test cases passed.");
    }
}
`;
}

// ── Python ───────────────────────────────────────────────────────────────────

function wrapPython(userCode: string, fn: string, testCases: TestCase[]): string {
    const tests = testCases.map((tc, i) => {
        const inputLines = (tc.inputPython || '')
            .split('\n')
            .map(l => l.trim())
            .filter(l => l)
            .map(l => `    ${l}`)
            .join('\n');
        const args = tc.argsPython || '';
        const expected = tc.expectedOutput;
        return `# Test Case ${i + 1}
try:
${inputLines}
    __result = sol.${fn}(${args})
    __expected = ${expected}
    if __result == __expected:
        print("Test Case ${i + 1}: PASSED ✓")
        __passed += 1
    else:
        print(f"Test Case ${i + 1}: FAILED ✗")
        print(f"  Expected: {__expected}")
        print(f"  Got:      {__result}")
except Exception as e:
    print(f"Test Case ${i + 1}: ERROR - {e}")
__total += 1`;
    }).join('\n\n');

    return `from typing import List, Optional
import collections

# ── User Code ──
${userCode}

sol = Solution()
__passed = 0
__total = 0

${tests}

print()
print(f"{__passed}/{__total} test cases passed.")
`;
}

// ── JavaScript ───────────────────────────────────────────────────────────────

function wrapJavaScript(userCode: string, fn: string, testCases: TestCase[]): string {
    const tests = testCases.map((tc, i) => {
        const inputCode = tc.inputJs || '';
        const args = tc.argsJs || '';
        const expected = tc.expectedOutput;
        return `
// Test Case ${i + 1}
try {
    ${inputCode}
    const __result = ${fn}(${args});
    const __expected = ${expected};
    const __got = JSON.stringify(__result);
    const __exp = JSON.stringify(__expected);
    if (__got === __exp) {
        console.log("Test Case ${i + 1}: PASSED ✓");
        __passed++;
    } else {
        console.log("Test Case ${i + 1}: FAILED ✗");
        console.log("  Expected: " + __exp);
        console.log("  Got:      " + __got);
    }
} catch(e) {
    console.log("Test Case ${i + 1}: ERROR - " + e.message);
}
__total++;`;
    }).join('\n');

    return `// ── User Code ──
${userCode}

let __passed = 0, __total = 0;
${tests}

console.log();
console.log(__passed + "/" + __total + " test cases passed.");
`;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function escStr(s: string): string {
    return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
