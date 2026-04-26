export const PROBLEMS = {
  "two-sum": {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    category: "Array • Hash Table",
    description: {
      text: "Given an array of integers nums and an integer target, return indices of the two numbers in the array such that they add up to target.",
      notes: [
        "You may assume that each input would have exactly one solution, and you may not use the same element twice.",
        "You can return the answer in any order.",
      ],
    },
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
      },
      {
        input: "nums = [3,3], target = 6",
        output: "[0,1]",
      },
    ],
    constraints: [
      "2 ≤ nums.length ≤ 10⁴",
      "-10⁹ ≤ nums[i] ≤ 10⁹",
      "-10⁹ ≤ target ≤ 10⁹",
      "Only one valid answer exists",
    ],
    starterCode: {
      javascript: `function twoSum(nums, target) {
  // Write your solution here
  
}

// Test cases
console.log(twoSum([2, 7, 11, 15], 9)); // Expected: [0, 1]
console.log(twoSum([3, 2, 4], 6)); // Expected: [1, 2]
console.log(twoSum([3, 3], 6)); // Expected: [0, 1]`,
      python: `def twoSum(nums, target):
    # Write your solution here
    pass

# Test cases
print(twoSum([2, 7, 11, 15], 9))  # Expected: [0, 1]
print(twoSum([3, 2, 4], 6))  # Expected: [1, 2]
print(twoSum([3, 3], 6))  # Expected: [0, 1]`,
      java: `import java.util.*;

class Solution {
    public static int[] twoSum(int[] nums, int target) {
        // Write your solution here
        
        return new int[0];
    }
    
    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[]{2, 7, 11, 15}, 9))); // Expected: [0, 1]
        System.out.println(Arrays.toString(twoSum(new int[]{3, 2, 4}, 6))); // Expected: [1, 2]
        System.out.println(Arrays.toString(twoSum(new int[]{3, 3}, 6))); // Expected: [0, 1]
    }
}`,
    },
    expectedOutput: {
      javascript: "[0,1]\n[1,2]\n[0,1]",
      python: "[0, 1]\n[1, 2]\n[0, 1]",
      java: "[0, 1]\n[1, 2]\n[0, 1]",
    },
  },

  "reverse-string": {
    id: "reverse-string",
    title: "Reverse String",
    difficulty: "Easy",
    category: "String • Two Pointers",
    description: {
      text: "Write a function that reverses a string. The input string is given as an array of characters s.",
      notes: ["You must do this by modifying the input array in-place with O(1) extra memory."],
    },
    examples: [
      {
        input: 's = ["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]',
      },
      {
        input: 's = ["H","a","n","n","a","h"]',
        output: '["h","a","n","n","a","H"]',
      },
    ],
    constraints: ["1 ≤ s.length ≤ 10⁵", "s[i] is a printable ascii character"],
    starterCode: {
      javascript: `function reverseString(s) {
  // Write your solution here
  
}

// Test cases
let test1 = ["h","e","l","l","o"];
reverseString(test1);
console.log(test1); // Expected: ["o","l","l","e","h"]

let test2 = ["H","a","n","n","a","h"];
reverseString(test2);
console.log(test2); // Expected: ["h","a","n","n","a","H"]`,
      python: `def reverseString(s):
    # Write your solution here
    pass

# Test cases
test1 = ["h","e","l","l","o"]
reverseString(test1)
print(test1)  # Expected: ["o","l","l","e","h"]

test2 = ["H","a","n","n","a","h"]
reverseString(test2)
print(test2)  # Expected: ["h","a","n","n","a","H"]`,
      java: `import java.util.*;

class Solution {
    public static void reverseString(char[] s) {
        // Write your solution here
        
    }
    
    public static void main(String[] args) {
        char[] test1 = {'h','e','l','l','o'};
        reverseString(test1);
        System.out.println(Arrays.toString(test1)); // Expected: [o, l, l, e, h]
        
        char[] test2 = {'H','a','n','n','a','h'};
        reverseString(test2);
        System.out.println(Arrays.toString(test2)); // Expected: [h, a, n, n, a, H]
    }
}`,
    },
    expectedOutput: {
      javascript: '["o","l","l","e","h"]\n["h","a","n","n","a","H"]',
      python: "['o', 'l', 'l', 'e', 'h']\n['h', 'a', 'n', 'n', 'a', 'H']",
      java: "[o, l, l, e, h]\n[h, a, n, n, a, H]",
    },
  },

  "valid-palindrome": {
    id: "valid-palindrome",
    title: "Valid Palindrome",
    difficulty: "Easy",
    category: "String • Two Pointers",
    description: {
      text: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.",
      notes: ["Given a string s, return true if it is a palindrome, or false otherwise."],
    },
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: "true",
        explanation: '"amanaplanacanalpanama" is a palindrome.',
      },
      {
        input: 's = "race a car"',
        output: "false",
        explanation: '"raceacar" is not a palindrome.',
      },
      {
        input: 's = " "',
        output: "true",
        explanation:
          's is an empty string "" after removing non-alphanumeric characters. Since an empty string reads the same forward and backward, it is a palindrome.',
      },
    ],
    constraints: ["1 ≤ s.length ≤ 2 * 10⁵", "s consists only of printable ASCII characters"],
    starterCode: {
      javascript: `function isPalindrome(s) {
  // Write your solution here
  
}

// Test cases
console.log(isPalindrome("A man, a plan, a canal: Panama")); // Expected: true
console.log(isPalindrome("race a car")); // Expected: false
console.log(isPalindrome(" ")); // Expected: true`,
      python: `def isPalindrome(s):
    # Write your solution here
    pass

# Test cases
print(isPalindrome("A man, a plan, a canal: Panama"))  # Expected: True
print(isPalindrome("race a car"))  # Expected: False
print(isPalindrome(" "))  # Expected: True`,
      java: `class Solution {
    public static boolean isPalindrome(String s) {
        // Write your solution here
        
        return false;
    }
    
    public static void main(String[] args) {
        System.out.println(isPalindrome("A man, a plan, a canal: Panama")); // Expected: true
        System.out.println(isPalindrome("race a car")); // Expected: false
        System.out.println(isPalindrome(" ")); // Expected: true
    }
}`,
    },
    expectedOutput: {
      javascript: "true\nfalse\ntrue",
      python: "True\nFalse\nTrue",
      java: "true\nfalse\ntrue",
    },
  },

  "maximum-subarray": {
    id: "maximum-subarray",
    title: "Maximum Subarray",
    difficulty: "Medium",
    category: "Array • Dynamic Programming",
    description: {
      text: "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
      notes: [],
    },
    examples: [
      {
        input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        output: "6",
        explanation: "The subarray [4,-1,2,1] has the largest sum 6.",
      },
      {
        input: "nums = [1]",
        output: "1",
        explanation: "The subarray [1] has the largest sum 1.",
      },
      {
        input: "nums = [5,4,-1,7,8]",
        output: "23",
        explanation: "The subarray [5,4,-1,7,8] has the largest sum 23.",
      },
    ],
    constraints: ["1 ≤ nums.length ≤ 10⁵", "-10⁴ ≤ nums[i] ≤ 10⁴"],
    starterCode: {
      javascript: `function maxSubArray(nums) {
  // Write your solution here
  
}

// Test cases
console.log(maxSubArray([-2,1,-3,4,-1,2,1,-5,4])); // Expected: 6
console.log(maxSubArray([1])); // Expected: 1
console.log(maxSubArray([5,4,-1,7,8])); // Expected: 23`,
      python: `def maxSubArray(nums):
    # Write your solution here
    pass

# Test cases
print(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]))  # Expected: 6
print(maxSubArray([1]))  # Expected: 1
print(maxSubArray([5,4,-1,7,8]))  # Expected: 23`,
      java: `class Solution {
    public static int maxSubArray(int[] nums) {
        // Write your solution here
        
        return 0;
    }
    
    public static void main(String[] args) {
        System.out.println(maxSubArray(new int[]{-2,1,-3,4,-1,2,1,-5,4})); // Expected: 6
        System.out.println(maxSubArray(new int[]{1})); // Expected: 1
        System.out.println(maxSubArray(new int[]{5,4,-1,7,8})); // Expected: 23
    }
}`,
    },
    expectedOutput: {
      javascript: "6\n1\n23",
      python: "6\n1\n23",
      java: "6\n1\n23",
    },
  },

  "container-with-most-water": {
    id: "container-with-most-water",
    title: "Container With Most Water",
    difficulty: "Medium",
    category: "Array • Two Pointers",
    description: {
      text: "You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).",
      notes: [
        "Find two lines that together with the x-axis form a container, such that the container contains the most water.",
        "Return the maximum amount of water a container can store.",
        "Notice that you may not slant the container.",
      ],
    },
    examples: [
      {
        input: "height = [1,8,6,2,5,4,8,3,7]",
        output: "49",
        explanation:
          "The vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water the container can contain is 49.",
      },
      {
        input: "height = [1,1]",
        output: "1",
      },
    ],
    constraints: ["n == height.length", "2 ≤ n ≤ 10⁵", "0 ≤ height[i] ≤ 10⁴"],
    starterCode: {
      javascript: `function maxArea(height) {
  // Write your solution here
  
}

// Test cases
console.log(maxArea([1,8,6,2,5,4,8,3,7])); // Expected: 49
console.log(maxArea([1,1])); // Expected: 1`,
      python: `def maxArea(height):
    # Write your solution here
    pass

# Test cases
print(maxArea([1,8,6,2,5,4,8,3,7]))  # Expected: 49
print(maxArea([1,1]))  # Expected: 1`,
      java: `class Solution {
    public static int maxArea(int[] height) {
        // Write your solution here
        
        return 0;
    }
    
    public static void main(String[] args) {
        System.out.println(maxArea(new int[]{1,8,6,2,5,4,8,3,7})); // Expected: 49
        System.out.println(maxArea(new int[]{1,1})); // Expected: 1
    }
}`,
    },
    expectedOutput: {
      javascript: "49\n1",
      python: "49\n1",
      java: "49\n1",
    },
  },

  "palindrome-number": {
    id: "palindrome-number",
    title: "Palindrome Number",
    difficulty: "Easy",
    category: "Math / Two Pointers",
    description: {
      text: "Given an integer x, return true if x is a palindrome, and false otherwise.",
      notes: ["An integer is a palindrome when it reads the same backward as forward."],
    },
    examples: [
      { input: "x = 121", output: "true" },
      { input: "x = -121", output: "false" },
      { input: "x = 10", output: "false" },
    ],
    constraints: ["-2^31 <= x <= 2^31 - 1"],
    starterCode: {
      javascript: `function isPalindrome(x) {
  // Write your solution here
  
}

console.log(isPalindrome(121)); // Expected: true
console.log(isPalindrome(-121)); // Expected: false
console.log(isPalindrome(10)); // Expected: false`,
      python: `def isPalindrome(x):
    # Write your solution here
    pass

print(isPalindrome(121))   # Expected: True
print(isPalindrome(-121))  # Expected: False
print(isPalindrome(10))    # Expected: False`,
      java: `class Solution {
    public static boolean isPalindrome(int x) {
        // Write your solution here
        return false;
    }

    public static void main(String[] args) {
        System.out.println(isPalindrome(121));   // Expected: true
        System.out.println(isPalindrome(-121));  // Expected: false
        System.out.println(isPalindrome(10));    // Expected: false
    }
}`,
    },
    expectedOutput: {
      javascript: "true\nfalse\nfalse",
      python: "True\nFalse\nFalse",
      java: "true\nfalse\nfalse",
    },
  },

  "best-time-to-buy-and-sell-stock": {
    id: "best-time-to-buy-and-sell-stock",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    category: "Array / Dynamic Programming",
    description: {
      text: "You are given an array prices where prices[i] is the price of a given stock on the ith day.",
      notes: ["Choose a single day to buy one stock and a different day in the future to sell that stock.", "Return the maximum profit you can achieve."],
    },
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5" },
      { input: "prices = [7,6,4,3,1]", output: "0" },
    ],
    constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
    starterCode: {
      javascript: `function maxProfit(prices) {
  // Write your solution here
  
}

console.log(maxProfit([7,1,5,3,6,4])); // Expected: 5
console.log(maxProfit([7,6,4,3,1])); // Expected: 0`,
      python: `def maxProfit(prices):
    # Write your solution here
    pass

print(maxProfit([7,1,5,3,6,4]))  # Expected: 5
print(maxProfit([7,6,4,3,1]))    # Expected: 0`,
      java: `class Solution {
    public static int maxProfit(int[] prices) {
        // Write your solution here
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(maxProfit(new int[]{7,1,5,3,6,4})); // Expected: 5
        System.out.println(maxProfit(new int[]{7,6,4,3,1}));   // Expected: 0
    }
}`,
    },
    expectedOutput: {
      javascript: "5\n0",
      python: "5\n0",
      java: "5\n0",
    },
  },

  "merge-sorted-array": {
    id: "merge-sorted-array",
    title: "Merge Sorted Array",
    difficulty: "Easy",
    category: "Array / Two Pointers",
    description: {
      text: "You are given two integer arrays nums1 and nums2, sorted in non-decreasing order, and two integers m and n.",
      notes: ["Merge nums2 into nums1 as one sorted array in-place."],
    },
    examples: [
      { input: "nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3", output: "[1,2,2,3,5,6]" },
      { input: "nums1 = [1], m = 1, nums2 = [], n = 0", output: "[1]" },
    ],
    constraints: ["nums1.length == m + n", "nums2.length == n", "0 <= m, n <= 200"],
    starterCode: {
      javascript: `function merge(nums1, m, nums2, n) {
  // Write your solution here
  
}

let nums1 = [1,2,3,0,0,0];
merge(nums1, 3, [2,5,6], 3);
console.log(nums1); // Expected: [1,2,2,3,5,6]`,
      python: `def merge(nums1, m, nums2, n):
    # Write your solution here
    pass

nums1 = [1,2,3,0,0,0]
merge(nums1, 3, [2,5,6], 3)
print(nums1)  # Expected: [1,2,2,3,5,6]`,
      java: `import java.util.*;

class Solution {
    public static void merge(int[] nums1, int m, int[] nums2, int n) {
        // Write your solution here
    }

    public static void main(String[] args) {
        int[] nums1 = {1,2,3,0,0,0};
        merge(nums1, 3, new int[]{2,5,6}, 3);
        System.out.println(Arrays.toString(nums1)); // Expected: [1, 2, 2, 3, 5, 6]
    }
}`,
    },
    expectedOutput: {
      javascript: "[1,2,2,3,5,6]",
      python: "[1, 2, 2, 3, 5, 6]",
      java: "[1, 2, 2, 3, 5, 6]",
    },
  },

  "valid-anagram": {
    id: "valid-anagram",
    title: "Valid Anagram",
    difficulty: "Easy",
    category: "Hash Table / String",
    description: {
      text: "Given two strings s and t, return true if t is an anagram of s, and false otherwise.",
      notes: [],
    },
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: "true" },
      { input: 's = "rat", t = "car"', output: "false" },
    ],
    constraints: ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters"],
    starterCode: {
      javascript: `function isAnagram(s, t) {
  // Write your solution here
  
}

console.log(isAnagram("anagram", "nagaram")); // Expected: true
console.log(isAnagram("rat", "car")); // Expected: false`,
      python: `def isAnagram(s, t):
    # Write your solution here
    pass

print(isAnagram("anagram", "nagaram"))  # Expected: True
print(isAnagram("rat", "car"))          # Expected: False`,
      java: `class Solution {
    public static boolean isAnagram(String s, String t) {
        // Write your solution here
        return false;
    }

    public static void main(String[] args) {
        System.out.println(isAnagram("anagram", "nagaram")); // Expected: true
        System.out.println(isAnagram("rat", "car"));         // Expected: false
    }
}`,
    },
    expectedOutput: {
      javascript: "true\nfalse",
      python: "True\nFalse",
      java: "true\nfalse",
    },
  },

  "binary-search": {
    id: "binary-search",
    title: "Binary Search",
    difficulty: "Easy",
    category: "Array / Binary Search",
    description: {
      text: "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums.",
      notes: ["Return the index if target exists, otherwise return -1."],
    },
    examples: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4" },
      { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1" },
    ],
    constraints: ["1 <= nums.length <= 10^4", "-10^4 < nums[i], target < 10^4"],
    starterCode: {
      javascript: `function search(nums, target) {
  // Write your solution here
  
}

console.log(search([-1,0,3,5,9,12], 9)); // Expected: 4
console.log(search([-1,0,3,5,9,12], 2)); // Expected: -1`,
      python: `def search(nums, target):
    # Write your solution here
    pass

print(search([-1,0,3,5,9,12], 9))  # Expected: 4
print(search([-1,0,3,5,9,12], 2))  # Expected: -1`,
      java: `class Solution {
    public static int search(int[] nums, int target) {
        // Write your solution here
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(search(new int[]{-1,0,3,5,9,12}, 9)); // Expected: 4
        System.out.println(search(new int[]{-1,0,3,5,9,12}, 2)); // Expected: -1
    }
}`,
    },
    expectedOutput: {
      javascript: "4\n-1",
      python: "4\n-1",
      java: "4\n-1",
    },
  },

  "climbing-stairs": {
    id: "climbing-stairs",
    title: "Climbing Stairs",
    difficulty: "Easy",
    category: "Dynamic Programming / Math",
    description: {
      text: "You are climbing a staircase. It takes n steps to reach the top.",
      notes: ["Each time you can either climb 1 or 2 steps. Return the number of distinct ways to climb to the top."],
    },
    examples: [
      { input: "n = 2", output: "2" },
      { input: "n = 3", output: "3" },
    ],
    constraints: ["1 <= n <= 45"],
    starterCode: {
      javascript: `function climbStairs(n) {
  // Write your solution here
  
}

console.log(climbStairs(2)); // Expected: 2
console.log(climbStairs(3)); // Expected: 3`,
      python: `def climbStairs(n):
    # Write your solution here
    pass

print(climbStairs(2))  # Expected: 2
print(climbStairs(3))  # Expected: 3`,
      java: `class Solution {
    public static int climbStairs(int n) {
        // Write your solution here
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(climbStairs(2)); // Expected: 2
        System.out.println(climbStairs(3)); // Expected: 3
    }
}`,
    },
    expectedOutput: {
      javascript: "2\n3",
      python: "2\n3",
      java: "2\n3",
    },
  },

  "sales-by-match": {
    id: "sales-by-match",
    title: "Sales by Match",
    difficulty: "Easy",
    category: "Array / Hash Table",
    description: {
      text: "There is a large pile of socks that must be paired by color.",
      notes: ["Given an array of integers representing each sock color, determine how many pairs of socks with matching colors there are."],
    },
    examples: [
      { input: "n = 9, ar = [10,20,20,10,10,30,50,10,20]", output: "3" },
      { input: "n = 7, ar = [1,2,1,2,1,3,2]", output: "2" },
    ],
    constraints: ["1 <= n <= 100", "1 <= ar[i] <= 100"],
    starterCode: {
      javascript: `function sockMerchant(n, ar) {
  // Write your solution here
  
}

console.log(sockMerchant(9, [10,20,20,10,10,30,50,10,20])); // Expected: 3`,
      python: `def sockMerchant(n, ar):
    # Write your solution here
    pass

print(sockMerchant(9, [10,20,20,10,10,30,50,10,20]))  # Expected: 3`,
      java: `class Solution {
    public static int sockMerchant(int n, int[] ar) {
        // Write your solution here
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(sockMerchant(9, new int[]{10,20,20,10,10,30,50,10,20})); // Expected: 3
    }
}`,
    },
    expectedOutput: {
      javascript: "3",
      python: "3",
      java: "3",
    },
  },

  "counting-valleys": {
    id: "counting-valleys",
    title: "Counting Valleys",
    difficulty: "Easy",
    category: "String / Simulation",
    description: {
      text: "An avid hiker keeps meticulous records of their hikes.",
      notes: ["Given the sequence of up and down steps during a hike, find and print the number of valleys walked through."],
    },
    examples: [
      { input: 'steps = 8, path = "UDDDUDUU"', output: "1" },
      { input: 'steps = 12, path = "DDUUDDUDUUUD"', output: "2" },
    ],
    constraints: ["2 <= steps <= 10^6", "path[i] is either U or D"],
    starterCode: {
      javascript: `function countingValleys(steps, path) {
  // Write your solution here
  
}

console.log(countingValleys(8, "UDDDUDUU")); // Expected: 1`,
      python: `def countingValleys(steps, path):
    # Write your solution here
    pass

print(countingValleys(8, "UDDDUDUU"))  # Expected: 1`,
      java: `class Solution {
    public static int countingValleys(int steps, String path) {
        // Write your solution here
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(countingValleys(8, "UDDDUDUU")); // Expected: 1
    }
}`,
    },
    expectedOutput: {
      javascript: "1",
      python: "1",
      java: "1",
    },
  },

  "three-sum": {
    id: "three-sum",
    title: "3Sum",
    difficulty: "Medium",
    category: "Array / Two Pointers",
    description: {
      text: "Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that they add up to 0.",
      notes: ["The solution set must not contain duplicate triplets."],
    },
    examples: [
      { input: "nums = [-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]" },
      { input: "nums = [0,1,1]", output: "[]" },
    ],
    constraints: ["3 <= nums.length <= 3000", "-10^5 <= nums[i] <= 10^5"],
    starterCode: {
      javascript: `function threeSum(nums) {
  // Write your solution here
  
}

console.log(threeSum([-1,0,1,2,-1,-4])); // Expected: [[-1,-1,2],[-1,0,1]]`,
      python: `def threeSum(nums):
    # Write your solution here
    pass

print(threeSum([-1,0,1,2,-1,-4]))  # Expected: [[-1, -1, 2], [-1, 0, 1]]`,
      java: `import java.util.*;

class Solution {
    public static List<List<Integer>> threeSum(int[] nums) {
        // Write your solution here
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        System.out.println(threeSum(new int[]{-1,0,1,2,-1,-4})); // Expected: [[-1, -1, 2], [-1, 0, 1]]
    }
}`,
    },
    expectedOutput: {
      javascript: "[[-1,-1,2],[-1,0,1]]",
      python: "[[-1, -1, 2], [-1, 0, 1]]",
      java: "[[-1, -1, 2], [-1, 0, 1]]",
    },
  },

  "product-of-array-except-self": {
    id: "product-of-array-except-self",
    title: "Product of Array Except Self",
    difficulty: "Medium",
    category: "Array / Prefix Sum",
    description: {
      text: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].",
      notes: ["Do it without using division and in O(n) time."],
    },
    examples: [
      { input: "nums = [1,2,3,4]", output: "[24,12,8,6]" },
      { input: "nums = [-1,1,0,-3,3]", output: "[0,0,9,0,0]" },
    ],
    constraints: ["2 <= nums.length <= 10^5", "-30 <= nums[i] <= 30"],
    starterCode: {
      javascript: `function productExceptSelf(nums) {
  // Write your solution here
  
}

console.log(productExceptSelf([1,2,3,4])); // Expected: [24,12,8,6]`,
      python: `def productExceptSelf(nums):
    # Write your solution here
    pass

print(productExceptSelf([1,2,3,4]))  # Expected: [24, 12, 8, 6]`,
      java: `import java.util.*;

class Solution {
    public static int[] productExceptSelf(int[] nums) {
        // Write your solution here
        return new int[0];
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(productExceptSelf(new int[]{1,2,3,4}))); // Expected: [24, 12, 8, 6]
    }
}`,
    },
    expectedOutput: {
      javascript: "[24,12,8,6]",
      python: "[24, 12, 8, 6]",
      java: "[24, 12, 8, 6]",
    },
  },

  "longest-substring-without-repeating-characters": {
    id: "longest-substring-without-repeating-characters",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    category: "String / Sliding Window",
    description: {
      text: "Given a string s, find the length of the longest substring without repeating characters.",
      notes: [],
    },
    examples: [
      { input: 's = "abcabcbb"', output: "3" },
      { input: 's = "bbbbb"', output: "1" },
      { input: 's = "pwwkew"', output: "3" },
    ],
    constraints: ["0 <= s.length <= 5 * 10^4"],
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {
  // Write your solution here
  
}

console.log(lengthOfLongestSubstring("abcabcbb")); // Expected: 3`,
      python: `def lengthOfLongestSubstring(s):
    # Write your solution here
    pass

print(lengthOfLongestSubstring("abcabcbb"))  # Expected: 3`,
      java: `class Solution {
    public static int lengthOfLongestSubstring(String s) {
        // Write your solution here
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(lengthOfLongestSubstring("abcabcbb")); // Expected: 3
    }
}`,
    },
    expectedOutput: {
      javascript: "3",
      python: "3",
      java: "3",
    },
  },

  "group-anagrams": {
    id: "group-anagrams",
    title: "Group Anagrams",
    difficulty: "Medium",
    category: "Array / Hash Table",
    description: {
      text: "Given an array of strings strs, group the anagrams together.",
      notes: ["You can return the answer in any order."],
    },
    examples: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' },
      { input: 'strs = [""]', output: '[[""]]' },
    ],
    constraints: ["1 <= strs.length <= 10^4", "0 <= strs[i].length <= 100"],
    starterCode: {
      javascript: `function groupAnagrams(strs) {
  // Write your solution here
  
}

console.log(groupAnagrams(["eat","tea","tan","ate","nat","bat"]));`,
      python: `def groupAnagrams(strs):
    # Write your solution here
    pass

print(groupAnagrams(["eat","tea","tan","ate","nat","bat"]))`,
      java: `import java.util.*;

class Solution {
    public static List<List<String>> groupAnagrams(String[] strs) {
        // Write your solution here
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        System.out.println(groupAnagrams(new String[]{"eat","tea","tan","ate","nat","bat"}));
    }
}`,
    },
    expectedOutput: {
      javascript: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
      python: "[['bat'], ['tan', 'nat'], ['eat', 'tea', 'ate']]",
      java: "[[bat], [tan, nat], [eat, tea, ate]]",
    },
  },

  "search-in-rotated-sorted-array": {
    id: "search-in-rotated-sorted-array",
    title: "Search in Rotated Sorted Array",
    difficulty: "Medium",
    category: "Array / Binary Search",
    description: {
      text: "There is an integer array nums sorted in ascending order with distinct values, and then rotated at an unknown pivot.",
      notes: ["Return the index of target if it is in nums, or -1 if it is not in nums."],
    },
    examples: [
      { input: "nums = [4,5,6,7,0,1,2], target = 0", output: "4" },
      { input: "nums = [4,5,6,7,0,1,2], target = 3", output: "-1" },
    ],
    constraints: ["1 <= nums.length <= 5000", "-10^4 <= nums[i], target <= 10^4"],
    starterCode: {
      javascript: `function search(nums, target) {
  // Write your solution here
  
}

console.log(search([4,5,6,7,0,1,2], 0)); // Expected: 4`,
      python: `def search(nums, target):
    # Write your solution here
    pass

print(search([4,5,6,7,0,1,2], 0))  # Expected: 4`,
      java: `class Solution {
    public static int search(int[] nums, int target) {
        // Write your solution here
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(search(new int[]{4,5,6,7,0,1,2}, 0)); // Expected: 4
    }
}`,
    },
    expectedOutput: {
      javascript: "4",
      python: "4",
      java: "4",
    },
  },

  "number-of-islands": {
    id: "number-of-islands",
    title: "Number of Islands",
    difficulty: "Medium",
    category: "Graph / DFS",
    description: {
      text: "Given an m x n 2D binary grid grid which represents a map of 1s (land) and 0s (water), return the number of islands.",
      notes: ["An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically."],
    },
    examples: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: "1" },
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: "3" },
    ],
    constraints: ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 300"],
    starterCode: {
      javascript: `function numIslands(grid) {
  // Write your solution here
  
}

console.log(numIslands([
  ["1","1","1","1","0"],
  ["1","1","0","1","0"],
  ["1","1","0","0","0"],
  ["0","0","0","0","0"]
])); // Expected: 1`,
      python: `def numIslands(grid):
    # Write your solution here
    pass

print(numIslands([
    ["1","1","1","1","0"],
    ["1","1","0","1","0"],
    ["1","1","0","0","0"],
    ["0","0","0","0","0"]
]))  # Expected: 1`,
      java: `class Solution {
    public static int numIslands(char[][] grid) {
        // Write your solution here
        return 0;
    }

    public static void main(String[] args) {
        System.out.println("Implement with a char[][] grid"); // Expected: 1 for sample grid
    }
}`,
    },
    expectedOutput: {
      javascript: "1",
      python: "1",
      java: "Implement with a char[][] grid",
    },
  },

  "course-schedule": {
    id: "course-schedule",
    title: "Course Schedule",
    difficulty: "Medium",
    category: "Graph / Topological Sort",
    description: {
      text: "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1.",
      notes: ["Return true if you can finish all courses, otherwise return false."],
    },
    examples: [
      { input: "numCourses = 2, prerequisites = [[1,0]]", output: "true" },
      { input: "numCourses = 2, prerequisites = [[1,0],[0,1]]", output: "false" },
    ],
    constraints: ["1 <= numCourses <= 2000", "0 <= prerequisites.length <= 5000"],
    starterCode: {
      javascript: `function canFinish(numCourses, prerequisites) {
  // Write your solution here
  
}

console.log(canFinish(2, [[1,0]])); // Expected: true
console.log(canFinish(2, [[1,0],[0,1]])); // Expected: false`,
      python: `def canFinish(numCourses, prerequisites):
    # Write your solution here
    pass

print(canFinish(2, [[1,0]]))         # Expected: True
print(canFinish(2, [[1,0],[0,1]]))   # Expected: False`,
      java: `class Solution {
    public static boolean canFinish(int numCourses, int[][] prerequisites) {
        // Write your solution here
        return false;
    }

    public static void main(String[] args) {
        System.out.println(canFinish(2, new int[][]{{1,0}}));       // Expected: true
        System.out.println(canFinish(2, new int[][]{{1,0},{0,1}})); // Expected: false
    }
}`,
    },
    expectedOutput: {
      javascript: "true\nfalse",
      python: "True\nFalse",
      java: "true\nfalse",
    },
  },

  "coin-change": {
    id: "coin-change",
    title: "Coin Change",
    difficulty: "Medium",
    category: "Dynamic Programming / BFS",
    description: {
      text: "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.",
      notes: ["Return the fewest number of coins needed to make up that amount, or -1 if it cannot be made up."],
    },
    examples: [
      { input: "coins = [1,2,5], amount = 11", output: "3" },
      { input: "coins = [2], amount = 3", output: "-1" },
    ],
    constraints: ["1 <= coins.length <= 12", "0 <= amount <= 10^4"],
    starterCode: {
      javascript: `function coinChange(coins, amount) {
  // Write your solution here
  
}

console.log(coinChange([1,2,5], 11)); // Expected: 3`,
      python: `def coinChange(coins, amount):
    # Write your solution here
    pass

print(coinChange([1,2,5], 11))  # Expected: 3`,
      java: `class Solution {
    public static int coinChange(int[] coins, int amount) {
        // Write your solution here
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(coinChange(new int[]{1,2,5}, 11)); // Expected: 3
    }
}`,
    },
    expectedOutput: {
      javascript: "3",
      python: "3",
      java: "3",
    },
  },

  "top-k-frequent-elements": {
    id: "top-k-frequent-elements",
    title: "Top K Frequent Elements",
    difficulty: "Medium",
    category: "Array / Heap",
    description: {
      text: "Given an integer array nums and an integer k, return the k most frequent elements.",
      notes: ["You may return the answer in any order."],
    },
    examples: [
      { input: "nums = [1,1,1,2,2,3], k = 2", output: "[1,2]" },
      { input: "nums = [1], k = 1", output: "[1]" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "k is in the range [1, the number of unique elements in the array]"],
    starterCode: {
      javascript: `function topKFrequent(nums, k) {
  // Write your solution here
  
}

console.log(topKFrequent([1,1,1,2,2,3], 2)); // Expected: [1,2]`,
      python: `def topKFrequent(nums, k):
    # Write your solution here
    pass

print(topKFrequent([1,1,1,2,2,3], 2))  # Expected: [1, 2]`,
      java: `import java.util.*;

class Solution {
    public static int[] topKFrequent(int[] nums, int k) {
        // Write your solution here
        return new int[0];
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(topKFrequent(new int[]{1,1,1,2,2,3}, 2))); // Expected: [1, 2]
    }
}`,
    },
    expectedOutput: {
      javascript: "[1,2]",
      python: "[1, 2]",
      java: "[1, 2]",
    },
  },

  "longest-palindromic-substring": {
    id: "longest-palindromic-substring",
    title: "Longest Palindromic Substring",
    difficulty: "Medium",
    category: "String / Dynamic Programming",
    description: {
      text: "Given a string s, return the longest palindromic substring in s.",
      notes: [],
    },
    examples: [
      { input: 's = "babad"', output: '"bab"' },
      { input: 's = "cbbd"', output: '"bb"' },
    ],
    constraints: ["1 <= s.length <= 1000"],
    starterCode: {
      javascript: `function longestPalindrome(s) {
  // Write your solution here
  
}

console.log(longestPalindrome("babad")); // Expected: "bab" or "aba"`,
      python: `def longestPalindrome(s):
    # Write your solution here
    pass

print(longestPalindrome("babad"))  # Expected: "bab" or "aba"`,
      java: `class Solution {
    public static String longestPalindrome(String s) {
        // Write your solution here
        return "";
    }

    public static void main(String[] args) {
        System.out.println(longestPalindrome("babad")); // Expected: bab or aba
    }
}`,
    },
    expectedOutput: {
      javascript: "bab",
      python: "bab",
      java: "bab",
    },
  },

  "minimum-bribes": {
    id: "minimum-bribes",
    title: "Minimum Bribes",
    difficulty: "Medium",
    category: "Array / Greedy",
    description: {
      text: "Given the queue state after people have bribed to move forward, determine the minimum number of bribes that took place.",
      notes: ["If anyone has bribed more than two people, print Too chaotic."],
    },
    examples: [
      { input: "q = [2,1,5,3,4]", output: "3" },
      { input: "q = [2,5,1,3,4]", output: "Too chaotic" },
    ],
    constraints: ["1 <= q.length <= 10^5"],
    starterCode: {
      javascript: `function minimumBribes(q) {
  // Write your solution here
  
}

console.log(minimumBribes([2,1,5,3,4])); // Expected: 3`,
      python: `def minimumBribes(q):
    # Write your solution here
    pass

print(minimumBribes([2,1,5,3,4]))  # Expected: 3`,
      java: `class Solution {
    public static String minimumBribes(int[] q) {
        // Write your solution here
        return "";
    }

    public static void main(String[] args) {
        System.out.println(minimumBribes(new int[]{2,1,5,3,4})); // Expected: 3
    }
}`,
    },
    expectedOutput: {
      javascript: "3",
      python: "3",
      java: "3",
    },
  },

  "daily-temperatures": {
    id: "daily-temperatures",
    title: "Daily Temperatures",
    difficulty: "Medium",
    category: "Array / Monotonic Stack",
    description: {
      text: "Given an array of integers temperatures, return an array answer such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature.",
      notes: ["If there is no future day for which this is possible, keep answer[i] == 0."],
    },
    examples: [
      { input: "temperatures = [73,74,75,71,69,72,76,73]", output: "[1,1,4,2,1,1,0,0]" },
      { input: "temperatures = [30,40,50,60]", output: "[1,1,1,0]" },
    ],
    constraints: ["1 <= temperatures.length <= 10^5", "30 <= temperatures[i] <= 100"],
    starterCode: {
      javascript: `function dailyTemperatures(temperatures) {
  // Write your solution here
  
}

console.log(dailyTemperatures([73,74,75,71,69,72,76,73])); // Expected: [1,1,4,2,1,1,0,0]`,
      python: `def dailyTemperatures(temperatures):
    # Write your solution here
    pass

print(dailyTemperatures([73,74,75,71,69,72,76,73]))  # Expected: [1, 1, 4, 2, 1, 1, 0, 0]`,
      java: `import java.util.*;

class Solution {
    public static int[] dailyTemperatures(int[] temperatures) {
        // Write your solution here
        return new int[0];
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(dailyTemperatures(new int[]{73,74,75,71,69,72,76,73}))); // Expected: [1, 1, 4, 2, 1, 1, 0, 0]
    }
}`,
    },
    expectedOutput: {
      javascript: "[1,1,4,2,1,1,0,0]",
      python: "[1, 1, 4, 2, 1, 1, 0, 0]",
      java: "[1, 1, 4, 2, 1, 1, 0, 0]",
    },
  },

  "median-of-two-sorted-arrays": {
    id: "median-of-two-sorted-arrays",
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    category: "Array / Binary Search",
    description: {
      text: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
      notes: ["The overall run time complexity should be O(log (m+n))."],
    },
    examples: [
      { input: "nums1 = [1,3], nums2 = [2]", output: "2.0" },
      { input: "nums1 = [1,2], nums2 = [3,4]", output: "2.5" },
    ],
    constraints: ["0 <= m <= 1000", "0 <= n <= 1000", "1 <= m + n <= 2000"],
    starterCode: {
      javascript: `function findMedianSortedArrays(nums1, nums2) {
  // Write your solution here
  
}

console.log(findMedianSortedArrays([1,3], [2])); // Expected: 2
console.log(findMedianSortedArrays([1,2], [3,4])); // Expected: 2.5`,
      python: `def findMedianSortedArrays(nums1, nums2):
    # Write your solution here
    pass

print(findMedianSortedArrays([1,3], [2]))      # Expected: 2.0
print(findMedianSortedArrays([1,2], [3,4]))    # Expected: 2.5`,
      java: `class Solution {
    public static double findMedianSortedArrays(int[] nums1, int[] nums2) {
        // Write your solution here
        return 0.0;
    }

    public static void main(String[] args) {
        System.out.println(findMedianSortedArrays(new int[]{1,3}, new int[]{2}));   // Expected: 2.0
        System.out.println(findMedianSortedArrays(new int[]{1,2}, new int[]{3,4})); // Expected: 2.5
    }
}`,
    },
    expectedOutput: {
      javascript: "2\n2.5",
      python: "2.0\n2.5",
      java: "2.0\n2.5",
    },
  },

  "merge-k-sorted-lists": {
    id: "merge-k-sorted-lists",
    title: "Merge k Sorted Lists",
    difficulty: "Hard",
    category: "Linked List / Heap",
    description: {
      text: "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.",
      notes: ["Merge all the linked-lists into one sorted linked-list and return it."],
    },
    examples: [
      { input: "lists = [[1,4,5],[1,3,4],[2,6]]", output: "[1,1,2,3,4,4,5,6]" },
      { input: "lists = []", output: "[]" },
    ],
    constraints: ["k == lists.length", "0 <= k <= 10^4"],
    starterCode: {
      javascript: `function mergeKLists(lists) {
  // Write your solution here
  
}

console.log("Implement and test with linked list helpers");`,
      python: `def mergeKLists(lists):
    # Write your solution here
    pass

print("Implement and test with linked list helpers")`,
      java: `class Solution {
    public static ListNode mergeKLists(ListNode[] lists) {
        // Write your solution here
        return null;
    }

    public static void main(String[] args) {
        System.out.println("Implement and test with linked list helpers");
    }
}`,
    },
    expectedOutput: {
      javascript: "Implement and test with linked list helpers",
      python: "Implement and test with linked list helpers",
      java: "Implement and test with linked list helpers",
    },
  },

  "trapping-rain-water": {
    id: "trapping-rain-water",
    title: "Trapping Rain Water",
    difficulty: "Hard",
    category: "Array / Two Pointers",
    description: {
      text: "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
      notes: [],
    },
    examples: [
      { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6" },
      { input: "height = [4,2,0,3,2,5]", output: "9" },
    ],
    constraints: ["1 <= height.length <= 2 * 10^4", "0 <= height[i] <= 10^5"],
    starterCode: {
      javascript: `function trap(height) {
  // Write your solution here
  
}

console.log(trap([0,1,0,2,1,0,1,3,2,1,2,1])); // Expected: 6`,
      python: `def trap(height):
    # Write your solution here
    pass

print(trap([0,1,0,2,1,0,1,3,2,1,2,1]))  # Expected: 6`,
      java: `class Solution {
    public static int trap(int[] height) {
        // Write your solution here
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(trap(new int[]{0,1,0,2,1,0,1,3,2,1,2,1})); // Expected: 6
    }
}`,
    },
    expectedOutput: {
      javascript: "6",
      python: "6",
      java: "6",
    },
  },

  "word-ladder": {
    id: "word-ladder",
    title: "Word Ladder",
    difficulty: "Hard",
    category: "Graph / BFS",
    description: {
      text: "A transformation sequence from word beginWord to word endWord using a dictionary wordList is a sequence of words.",
      notes: ["Return the number of words in the shortest transformation sequence, or 0 if no such sequence exists."],
    },
    examples: [
      { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', output: "5" },
      { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]', output: "0" },
    ],
    constraints: ["1 <= beginWord.length <= 10", "1 <= wordList.length <= 5000"],
    starterCode: {
      javascript: `function ladderLength(beginWord, endWord, wordList) {
  // Write your solution here
  
}

console.log(ladderLength("hit", "cog", ["hot","dot","dog","lot","log","cog"])); // Expected: 5`,
      python: `def ladderLength(beginWord, endWord, wordList):
    # Write your solution here
    pass

print(ladderLength("hit", "cog", ["hot","dot","dog","lot","log","cog"]))  # Expected: 5`,
      java: `import java.util.*;

class Solution {
    public static int ladderLength(String beginWord, String endWord, List<String> wordList) {
        // Write your solution here
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(ladderLength("hit", "cog", Arrays.asList("hot","dot","dog","lot","log","cog"))); // Expected: 5
    }
}`,
    },
    expectedOutput: {
      javascript: "5",
      python: "5",
      java: "5",
    },
  },

  "serialize-and-deserialize-binary-tree": {
    id: "serialize-and-deserialize-binary-tree",
    title: "Serialize and Deserialize Binary Tree",
    difficulty: "Hard",
    category: "Tree / Design",
    description: {
      text: "Serialization is the process of converting a data structure or object into a sequence of bits so that it can be stored or transmitted.",
      notes: ["Design an algorithm to serialize and deserialize a binary tree."],
    },
    examples: [
      { input: "root = [1,2,3,null,null,4,5]", output: "[1,2,3,null,null,4,5]" },
      { input: "root = []", output: "[]" },
    ],
    constraints: ["The number of nodes in the tree is in the range [0, 10^4]."],
    starterCode: {
      javascript: `class Codec {
  serialize(root) {
    // Write your solution here
  }

  deserialize(data) {
    // Write your solution here
  }
}

console.log("Implement and test with tree helpers");`,
      python: `class Codec:
    def serialize(self, root):
        # Write your solution here
        pass

    def deserialize(self, data):
        # Write your solution here
        pass

print("Implement and test with tree helpers")`,
      java: `public class Codec {
    public String serialize(TreeNode root) {
        // Write your solution here
        return "";
    }

    public TreeNode deserialize(String data) {
        // Write your solution here
        return null;
    }

    public static void main(String[] args) {
        System.out.println("Implement and test with tree helpers");
    }
}`,
    },
    expectedOutput: {
      javascript: "Implement and test with tree helpers",
      python: "Implement and test with tree helpers",
      java: "Implement and test with tree helpers",
    },
  },

  "n-queens": {
    id: "n-queens",
    title: "N-Queens",
    difficulty: "Hard",
    category: "Backtracking",
    description: {
      text: "The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other.",
      notes: ["Return all distinct solutions to the n-queens puzzle."],
    },
    examples: [
      { input: "n = 4", output: '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]' },
      { input: "n = 1", output: '[["Q"]]' },
    ],
    constraints: ["1 <= n <= 9"],
    starterCode: {
      javascript: `function solveNQueens(n) {
  // Write your solution here
  
}

console.log(solveNQueens(4));`,
      python: `def solveNQueens(n):
    # Write your solution here
    pass

print(solveNQueens(4))`,
      java: `import java.util.*;

class Solution {
    public static List<List<String>> solveNQueens(int n) {
        // Write your solution here
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        System.out.println(solveNQueens(4));
    }
}`,
    },
    expectedOutput: {
      javascript: '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]',
      python: "[['.Q..', '...Q', 'Q...', '..Q.'], ['..Q.', 'Q...', '...Q', '.Q..']]",
      java: "[[.Q.., ...Q, Q..., ..Q.], [..Q., Q..., ...Q, .Q..]]",
    },
  },

  "largest-rectangle-in-histogram": {
    id: "largest-rectangle-in-histogram",
    title: "Largest Rectangle in Histogram",
    difficulty: "Hard",
    category: "Array / Monotonic Stack",
    description: {
      text: "Given an array of integers heights representing the histogram's bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram.",
      notes: [],
    },
    examples: [
      { input: "heights = [2,1,5,6,2,3]", output: "10" },
      { input: "heights = [2,4]", output: "4" },
    ],
    constraints: ["1 <= heights.length <= 10^5", "0 <= heights[i] <= 10^4"],
    starterCode: {
      javascript: `function largestRectangleArea(heights) {
  // Write your solution here
  
}

console.log(largestRectangleArea([2,1,5,6,2,3])); // Expected: 10`,
      python: `def largestRectangleArea(heights):
    # Write your solution here
    pass

print(largestRectangleArea([2,1,5,6,2,3]))  # Expected: 10`,
      java: `class Solution {
    public static int largestRectangleArea(int[] heights) {
        // Write your solution here
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(largestRectangleArea(new int[]{2,1,5,6,2,3})); // Expected: 10
    }
}`,
    },
    expectedOutput: {
      javascript: "10",
      python: "10",
      java: "10",
    },
  },

  "sudoku-solver": {
    id: "sudoku-solver",
    title: "Sudoku Solver",
    difficulty: "Hard",
    category: "Backtracking / Matrix",
    description: {
      text: "Write a program to solve a Sudoku puzzle by filling the empty cells.",
      notes: ["Empty cells are indicated by the character '.'."],
    },
    examples: [
      { input: "board = 9x9 sudoku grid", output: "Solved board" },
      { input: "board = valid partially filled sudoku", output: "Solved board" },
    ],
    constraints: ["board.length == 9", "board[i].length == 9"],
    starterCode: {
      javascript: `function solveSudoku(board) {
  // Write your solution here
  
}

console.log("Implement and test with a 9x9 board");`,
      python: `def solveSudoku(board):
    # Write your solution here
    pass

print("Implement and test with a 9x9 board")`,
      java: `class Solution {
    public static void solveSudoku(char[][] board) {
        // Write your solution here
    }

    public static void main(String[] args) {
        System.out.println("Implement and test with a 9x9 board");
    }
}`,
    },
    expectedOutput: {
      javascript: "Implement and test with a 9x9 board",
      python: "Implement and test with a 9x9 board",
      java: "Implement and test with a 9x9 board",
    },
  },

  "sliding-window-maximum": {
    id: "sliding-window-maximum",
    title: "Sliding Window Maximum",
    difficulty: "Hard",
    category: "Array / Deque",
    description: {
      text: "You are given an array of integers nums, there is a sliding window of size k which is moving from the very left of the array to the very right.",
      notes: ["Return the max sliding window."],
    },
    examples: [
      { input: "nums = [1,3,-1,-3,5,3,6,7], k = 3", output: "[3,3,5,5,6,7]" },
      { input: "nums = [1], k = 1", output: "[1]" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "1 <= k <= nums.length"],
    starterCode: {
      javascript: `function maxSlidingWindow(nums, k) {
  // Write your solution here
  
}

console.log(maxSlidingWindow([1,3,-1,-3,5,3,6,7], 3)); // Expected: [3,3,5,5,6,7]`,
      python: `def maxSlidingWindow(nums, k):
    # Write your solution here
    pass

print(maxSlidingWindow([1,3,-1,-3,5,3,6,7], 3))  # Expected: [3, 3, 5, 5, 6, 7]`,
      java: `import java.util.*;

class Solution {
    public static int[] maxSlidingWindow(int[] nums, int k) {
        // Write your solution here
        return new int[0];
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(maxSlidingWindow(new int[]{1,3,-1,-3,5,3,6,7}, 3))); // Expected: [3, 3, 5, 5, 6, 7]
    }
}`,
    },
    expectedOutput: {
      javascript: "[3,3,5,5,6,7]",
      python: "[3, 3, 5, 5, 6, 7]",
      java: "[3, 3, 5, 5, 6, 7]",
    },
  },

  "regular-expression-matching": {
    id: "regular-expression-matching",
    title: "Regular Expression Matching",
    difficulty: "Hard",
    category: "String / Dynamic Programming",
    description: {
      text: "Given an input string s and a pattern p, implement regular expression matching with support for '.' and '*'.",
      notes: ["The matching should cover the entire input string."],
    },
    examples: [
      { input: 's = "aa", p = "a"', output: "false" },
      { input: 's = "aa", p = "a*"', output: "true" },
      { input: 's = "ab", p = ".*"', output: "true" },
    ],
    constraints: ["1 <= s.length <= 20", "1 <= p.length <= 20"],
    starterCode: {
      javascript: `function isMatch(s, p) {
  // Write your solution here
  
}

console.log(isMatch("aa", "a"));  // Expected: false
console.log(isMatch("aa", "a*")); // Expected: true`,
      python: `def isMatch(s, p):
    # Write your solution here
    pass

print(isMatch("aa", "a"))   # Expected: False
print(isMatch("aa", "a*"))  # Expected: True`,
      java: `class Solution {
    public static boolean isMatch(String s, String p) {
        // Write your solution here
        return false;
    }

    public static void main(String[] args) {
        System.out.println(isMatch("aa", "a"));   // Expected: false
        System.out.println(isMatch("aa", "a*"));  // Expected: true
    }
}`,
    },
    expectedOutput: {
      javascript: "false\ntrue",
      python: "False\nTrue",
      java: "false\ntrue",
    },
  },
};

export const LANGUAGE_CONFIG = {
  javascript: {
    name: "JavaScript",
    icon: "/javascript.png",
    monacoLang: "javascript",
  },
  python: {
    name: "Python",
    icon: "/python.png",
    monacoLang: "python",
  },
  java: {
    name: "Java",
    icon: "/java.png",
    monacoLang: "java",
  },
};
