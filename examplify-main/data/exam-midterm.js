/* MID-TERM EXAM (Semester 1 : AY 2025/26)
   (file: cs1010e_2526S1_midterm.pdf) — 31 questions.
   The source PDF is the question paper only, so every key here was derived
   by working the question out rather than copied from a provided answer sheet. */
registerExam({
  id: 'midterm',
  title: 'MID-TERM EXAM (Semester 1 : AY 2025/26)',
  headerName: 'MID-TERM EXAM (Semester 1 : AY 2025/26)',
  source: 'cs1010e_2526S1_midterm.pdf',
  duration: 90,
  sections: [
    { name: 'Part A — One mark each', from: 1, to: 12, marks: 1 },
    { name: 'Part B — Two marks each', from: 13, to: 23, marks: 2 },
    { name: 'Part C — Fill in the blanks (3–4 marks each)', from: 24, to: 31, marks: 3 }
  ],
  questions: [
    {
      n: 1, marks: 1, type: 'mcq',
      stem: [
        { p: 'Given that the `**` operator is right associative and has a higher precedence than the `*` operator, which of the options is equivalent to the following expression?' },
        { code: '2 * 3 ** 4 ** 5' }
      ],
      options: [
        { l: 'A', t: '2 * (3 ** (4 ** 5))' },
        { l: 'B', t: '2 * ((3 ** 4) ** 5)' },
        { l: 'C', t: '(2 * 3) ** (4 ** 5)' },
        { l: 'D', t: '((2 * 3) ** 4) ** 5' },
        { l: 'E', t: '(2 * (3 ** 4)) ** 5' }
      ],
      answer: 'A',
      explanation: 'Right associativity groups the exponents from the right: 3 ** (4 ** 5). The multiplication sits outside because ** binds tighter than *.'
    },
    {
      n: 2, marks: 1, type: 'mcq',
      stem: [
        { p: 'What is returned from the following evaluation?' },
        { code: '>>> 50 % 3' }
      ],
      options: [
        { l: 'A', t: '2' }, { l: 'B', t: '0' }, { l: 'C', t: '1' },
        { l: 'D', t: '3' }, { l: 'E', t: 'None of the above' }
      ],
      answer: 'A',
      explanation: '50 = 16 * 3 + 2, so the remainder is 2.'
    },
    {
      n: 3, marks: 1, type: 'mcq',
      stem: [
        { p: 'Given the following function definition:' },
        { code: 'def foo(x):\n    def gee(x):\n        return 3 * x\n    return gee(2 + x)' },
        { p: 'What is the result of the following evaluation?' },
        { code: '>>> foo(5)' }
      ],
      options: [
        { l: 'A', t: '21' }, { l: 'B', t: '7' }, { l: 'C', t: '15' },
        { l: 'D', t: '17' }, { l: 'E', t: 'Error' }
      ],
      answer: 'A',
      explanation: 'gee is called with 2 + 5 = 7, so it returns 3 * 7 = 21. The inner x shadows the outer one.'
    },
    {
      n: 4, marks: 1, type: 'mcq',
      stem: [
        { p: 'What is returned from the following evaluation, given that x holds the value 1?' },
        { code: '>>> 3 if x == 1 else -3' }
      ],
      options: [
        { l: 'A', t: '3' }, { l: 'B', t: 'True' }, { l: 'C', t: 'False' },
        { l: 'D', t: '-3' }, { l: 'E', t: 'None of the above' }
      ],
      answer: 'A',
      explanation: 'The condition is True, so the conditional expression yields 3 — not the Boolean True.'
    },
    {
      n: 5, marks: 1, type: 'mcq',
      stem: [
        { p: 'What will be returned from the following evaluation?' },
        { code: '>>> tuple(map(lambda x: x, range(10, 0, -2)))' }
      ],
      options: [
        { l: 'A', t: '(10, 8, 6, 4, 2)' }, { l: 'B', t: '(2, 4, 6, 8, 10)' },
        { l: 'C', t: '(10, 8, 6, 4, 2, 0)' }, { l: 'D', t: '(0, 2, 4, 6, 8, 10)' },
        { l: 'E', t: 'None of the above' }
      ],
      answer: 'A',
      explanation: 'Starts at 10, steps by -2, stops before 0. The stop value is exclusive, so 0 is not produced.'
    },
    {
      n: 6, marks: 1, type: 'mcq',
      stem: [
        { p: 'What will be returned from the following evaluation?' },
        { code: '>>> tuple(range(3, 0, -1))' }
      ],
      options: [
        { l: 'A', t: '(3, 2, 1)' }, { l: 'B', t: '(3, 2, 1, 0)' },
        { l: 'C', t: '(2, 1)' }, { l: 'D', t: '(2, 1, 0)' },
        { l: 'E', t: 'None of the above' }
      ],
      answer: 'A',
      explanation: 'range(3, 0, -1) yields 3, 2, 1. The stop of 0 is exclusive.'
    },
    {
      n: 7, marks: 1, type: 'mcq',
      stem: [
        { p: 'What will be returned from the following evaluation?' },
        { code: ">>> 'my@love'[2:7]" }
      ],
      options: [
        { l: 'A', t: "'@love'" }, { l: 'B', t: "'love'" }, { l: 'C', t: "'lov'" },
        { l: 'D', t: "'@lov'" }, { l: 'E', t: 'None of the above' }
      ],
      answer: 'A',
      explanation: "Indices 2 to 6 inclusive are '@', 'l', 'o', 'v', 'e'."
    },
    {
      n: 8, marks: 1, type: 'mcq',
      stem: [
        { p: 'What will be returned from the following evaluation?' },
        { code: '>>> (1, 3, 5, 7) + (2, 4)' }
      ],
      options: [
        { l: 'A', t: '(1, 2, 3, 4, 5, 7)' },
        { l: 'B', t: '(1, 3, 5, 7, (2, 4))' },
        { l: 'C', t: '((1, 3, 5, 7), (2, 4))' },
        { l: 'D', t: 'Error' },
        { l: 'E', t: 'None of the above' }
      ],
      answer: 'E',
      explanation: '+ concatenates tuples rather than interleaving or nesting: the result is (1, 3, 5, 7, 2, 4), which is not listed, so the answer is E.'
    },
    {
      n: 9, marks: 1, type: 'mcq',
      stem: [
        { p: 'What value is printed when the following program is evaluated?' },
        { code: 'def cnt():\n    count = 0\n    for x in range(10):\n        for y in range(x):\n            count = count + 1\n    print(count)\n\n>>> cnt()' }
      ],
      options: [
        { l: 'A', t: '45' }, { l: 'B', t: '55' }, { l: 'C', t: '36' },
        { l: 'D', t: '10' }, { l: 'E', t: '9' }
      ],
      answer: 'A',
      explanation: 'The inner loop runs x times, so the total is 0 + 1 + ... + 9 = 45.'
    },
    {
      n: 10, marks: 1, type: 'mcq',
      stem: [
        { p: 'Given the following function definition:' },
        { code: "def hoo(n):\n    if n <= 1:\n        return 1\n    else:\n        print(n, end=' ')\n        return 2 * hoo(n - 1)" },
        { p: 'What is the sequence of values printed by the print function when the following is evaluated?' },
        { code: '>>> hoo(6)' }
      ],
      options: [
        { l: 'A', t: '6  5  4  3  2' }, { l: 'B', t: '2  3  4  5  6' },
        { l: 'C', t: '32  16  8  4  2' }, { l: 'D', t: '2  4  8  16  32' },
        { l: 'E', t: '6  12  24  48  96' }
      ],
      answer: 'A',
      explanation: 'The print happens on the way down, before the recursive call, so the values descend from 6 to 2.'
    },
    {
      n: 11, marks: 1, type: 'mcq',
      stem: [
        { p: 'What will be printed from the following piece of python code is being executed?' },
        { code: 'res = ()\na = 4\nwhile a > 2:\n    res = res + (a, a + 1)\n    a -= 1\nprint(res)' }
      ],
      options: [
        { l: 'A', t: '(4, 5, 3, 4)' }, { l: 'B', t: '((4, 5), (3, 4))' },
        { l: 'C', t: '(3, 4, 4, 5)' }, { l: 'D', t: '((3, 4), (4, 5))' },
        { l: 'E', t: 'None of the above' }
      ],
      answer: 'A',
      explanation: '(a, a + 1) is a two-element tuple, and + concatenates flat: () → (4, 5) → (4, 5, 3, 4). The loop stops once a reaches 2.'
    },
    {
      n: 12, marks: 1, type: 'mcq',
      stem: [
        { p: 'What will be returned by evaluating the function call `rec2(2, 1)`?' },
        { code: 'def rec2(n, m):\n    if n == 0 or m == 0:\n        return 1\n    return rec2(n - 1, m) + rec2(n - 1, m - 1)' }
      ],
      options: [
        { l: 'A', t: '1' }, { l: 'B', t: '2' }, { l: 'C', t: '4' },
        { l: 'D', t: 'Error' }, { l: 'E', t: 'None of the above' }
      ],
      answer: 'E',
      explanation: 'rec2(2,1) = rec2(1,1) + rec2(1,0) = (rec2(0,1) + rec2(0,0)) + 1 = (1 + 1) + 1 = 3, which is not among A–D, so E.'
    },

    {
      n: 13, marks: 2, type: 'mcq',
      stem: [
        { p: 'Given that x has value 3 and y has value 0, what is returned from the following evaluation?' },
        { code: '>>> x + x if x != 3 and x // y > 0 else y + y' }
      ],
      options: [
        { l: 'A', t: '0' }, { l: 'B', t: '3' }, { l: 'C', t: '6' },
        { l: 'D', t: 'Error' }, { l: 'E', t: 'None of the above' }
      ],
      answer: 'A',
      explanation: 'x != 3 is False, so `and` short-circuits and x // y is never evaluated. The condition is False, so the else branch gives 0 + 0 = 0.'
    },
    {
      n: 14, marks: 2, type: 'mcq',
      stem: [
        { p: 'What will be returned from the execution of the function call `mR1((5, 4, 3))`?' },
        { code: 'from functools import reduce\n\ndef mR1(tup):\n    return reduce(lambda a, b: a + ((b, tup[b]),),\n                  range(len(tup)))' }
      ],
      options: [
        { l: 'A', t: 'Error' },
        { l: 'B', t: '((0, 5), (1, 4), (2, 3))' },
        { l: 'C', t: '((), (0, 5), (1, 4), (2, 3))' },
        { l: 'D', t: '(0, 5, 1, 4, 2, 3)' },
        { l: 'E', t: 'None of the above' }
      ],
      answer: 'A',
      explanation: 'With no initializer reduce seeds the accumulator from the sequence itself, so the first call is 0 + ((1, tup[1]),) — an int plus a tuple, which raises TypeError. An initializer of () would have been needed.'
    },
    {
      n: 15, marks: 2, type: 'mcq',
      stem: [
        { p: 'Given the following function definition:' },
        { code: 'def fun(g, h, x, y):\n    return g(x) + h(y)' },
        { p: 'What is the result of the following evaluation?' },
        { code: '>>> x = 2\n>>> y = 3\n>>> fun(lambda x: x - y, lambda y: x * y, 7, 4)' }
      ],
      options: [
        { l: 'A', t: '12' }, { l: 'B', t: '5' }, { l: 'C', t: '15' },
        { l: 'D', t: '25' }, { l: 'E', t: '31' }
      ],
      answer: 'A',
      explanation: 'Each lambda parameter shadows the global of the same name only inside its own body: the first computes 7 - 3 = 4 and the second computes 2 * 4 = 8. Total 12.'
    },
    {
      n: 16, marks: 2, type: 'mcq',
      stem: [
        { p: 'Given the following function definition:' },
        { code: 'def fun(x, y):\n    z = 2\n    return lambda y, z: 100 * x + 10 * y + z' },
        { p: 'What is the result of the following evaluation?' },
        { code: '>>> (fun(5, 6))(7, 8)' }
      ],
      options: [
        { l: 'A', t: '578' }, { l: 'B', t: '562' }, { l: 'C', t: '572' },
        { l: 'D', t: '568' }, { l: 'E', t: '786' }
      ],
      answer: 'A',
      explanation: 'x = 5 is captured from the enclosing call; the lambda parameters supply y = 7 and z = 8, giving 500 + 70 + 8 = 578. The local z = 2 is shadowed.'
    },
    {
      n: 17, marks: 2, type: 'mcq',
      stem: [
        { p: 'Given the following definition of the function D:' },
        { code: "def D(m, x):\n    print(m, end=' ')\n    return x" },
        { p: 'What is the sequence of values printed by the print function when the following is evaluated?' },
        { code: ">>> ( D('P', True) and D('Q', False) ) and \\\n... ( D('R', False) or D('S', True) )" }
      ],
      options: [
        { l: 'A', t: 'P Q' }, { l: 'B', t: 'P Q R S' }, { l: 'C', t: 'P Q R' },
        { l: 'D', t: 'P R' }, { l: 'E', t: 'P' }
      ],
      answer: 'A',
      explanation: "The left group short-circuits at the second call: D('P', True) and D('Q', False) evaluates both and yields False, so the outer `and` skips the right group entirely."
    },
    {
      n: 18, marks: 2, type: 'mcq',
      stem: [
        { p: 'How many times will the line `count += 1` be executed?' },
        { code: 'i = 0\nj = 10\ncount = 0\nwhile i < j:\n    i += 1\n    j -= 1\n    count += 1' }
      ],
      options: [
        { l: 'A', t: '5' }, { l: 'B', t: '6' }, { l: 'C', t: '0' },
        { l: 'D', t: '10' }, { l: 'E', t: 'Infinite loop' }
      ],
      answer: 'A',
      explanation: 'The gap closes by 2 each pass: (0,10) → (1,9) → (2,8) → (3,7) → (4,6) → (5,5), where the test fails. Five iterations.'
    },
    {
      n: 19, marks: 2, type: 'mcq',
      stem: [
        { p: 'What will be returned from the following evaluation?' },
        { code: '>>> tup = (1, (2, 4), 3, (4, 2), 1)\n>>> tup[ tup[-2][ tup[0] ] ]' }
      ],
      options: [
        { l: 'A', t: '3' }, { l: 'B', t: '2' }, { l: 'C', t: '4' },
        { l: 'D', t: '1' }, { l: 'E', t: 'Error' }
      ],
      answer: 'A',
      explanation: 'tup[-2] is (4, 2) and tup[0] is 1, so the inner index gives 2, and tup[2] is 3.'
    },
    {
      n: 20, marks: 2, type: 'mcq',
      stem: [
        { p: 'What will be returned from the following evaluation?' },
        { code: ">>> tuple( filter( lambda x: '0' < x < '9', 'CS1010E' ) )" }
      ],
      options: [
        { l: 'A', t: "('1', '1')" }, { l: 'B', t: "('11',)" },
        { l: 'C', t: "('1', '0', '1', '0')" }, { l: 'D', t: "('1010',)" },
        { l: 'E', t: 'Error' }
      ],
      answer: 'A',
      explanation: 'Both comparisons are strict, so the two 0s fail the left test. filter over a string yields individual characters, not joined substrings — and the 1s sit at non-adjacent positions anyway.'
    },
    {
      n: 21, marks: 2, type: 'mcq',
      stem: [
        { p: 'Given that x, y and z are three positive integers. What is the most accurate description of the range of values to be assigned to r from the following evaluation?' },
        { code: '>>> r = x % y % z' }
      ],
      options: [
        { l: 'A', t: '0 <= r < min(x, y, z)' },
        { l: 'B', t: '0 <= r < x' },
        { l: 'C', t: '0 <= r < y' },
        { l: 'D', t: '0 <= r < z' },
        { l: 'E', t: '0 <= r < max(x, y, z)' }
      ],
      answer: 'E',
      explanation: 'The expression is (x % y) % z. Careful: r < y and r < z are also always true, so C and D hold as well and only the max bound is a description valid without knowing which of y and z is smaller. B fails (x = 2, y = 5, z = 7 gives r = 2), and A fails for the same example. Treat this item as ambiguous.'
    },
    {
      n: 22, marks: 2, type: 'mcq',
      stem: [
        { p: 'Which of the following expressions will always produce the same value as expression t1 below?' },
        { code: ">>> t1 = tuple(filter(lambda x: 100 % int(x), \\\n...                   filter(lambda x: ord('9') > ord(x) > ord('0'), s)))" }
      ],
      options: [
        { l: 'A', t: "tuple(filter(lambda x: ord('9') > ord(x) > ord('0') and 100 % int(x), s))" },
        { l: 'B', t: "tuple(filter(lambda x: 100 % int(x) and ord('9') > ord(x) > ord('0'), s))" },
        { l: 'C', t: "tuple(filter(lambda x: 100 % int(x) or ord('9') > ord(x) > ord('0'), s))" },
        { l: 'D', t: 'Both A and B above' },
        { l: 'E', t: 'None of the above' }
      ],
      answer: 'A',
      explanation: "B reverses the tests, so int(x) is applied to non-digit characters and int('C') raises ValueError. A keeps the digit test first and `and` short-circuits, preserving the protection."
    },
    {
      n: 23, marks: 2, type: 'fib',
      stem: [
        { p: 'Using less than 20 ASCII characters, state one big event to be happening in Singapore in these few days? (A blank answer will receive 0 mark.)' }
      ],
      blanks: [
        { n: 1, answer: '', freeform: true, maxLength: 20 }
      ],
      explanation: 'Free-response warm-up item. Any non-empty answer under 20 characters is accepted.'
    },

    {
      n: 24, marks: 3, type: 'fib',
      stem: [
        { p: 'The function `zip_tup` takes in two tuples of equal length and returns a tuple that contains all the elements of the first input tuple interleaved with the elements of the second input tuple. For example,' },
        { code: ">>> zip_tup((1, 2, 3, 4), (5, 6, 7, 8))\n(1, 5, 2, 6, 3, 7, 4, 8)" },
        { p: 'Complete the following definition of zip_tup by filling in the three missing expressions:' },
        { code: 'def zip_tup(t1, t2):\n    if len(t1) == 0:\n        return ()\n    else:\n        return {{1}} + zip_tup({{2}}, {{3}})' }
      ],
      blanks: [
        { n: 1, answer: '(t1[0], t2[0])' },
        { n: 2, answer: 't1[1:]' },
        { n: 3, answer: 't2[1:]' }
      ],
      explanation: 'Take both heads as a two-element tuple, then recurse on both tails so the tuples stay in step.'
    },
    {
      n: 25, marks: 3, type: 'fib',
      stem: [
        { p: 'What is the result of evaluating the call `tfold((5, 4, 3, 2))` given the following function definition?' },
        { code: 'from functools import reduce\n\ndef tfold(tup):\n    return reduce(lambda a, b: (a[0] + (a[1] + b,), b),\n                  tup[1:], ((), tup[0]))[0]' }
      ],
      blanks: [
        { n: 1, answer: '(9, 7, 5)' }
      ],
      explanation: 'The accumulator carries the growing tuple and the previous element: ((9,), 4) → ((9, 7), 3) → ((9, 7, 5), 2), and [0] discards the carry. These are the sums of adjacent pairs.'
    },
    {
      n: 26, marks: 3, type: 'fib',
      stem: [
        { p: 'Given the following function definition:' },
        { code: 'def fofo(f):\n    return lambda x: f(f(x))' },
        { p: 'What is the result of the following evaluation?' },
        { code: '>>> (fofo(lambda x: 3 * x + 1))(5)' }
      ],
      blanks: [
        { n: 1, answer: '49' }
      ],
      explanation: 'f is applied twice: inner 3 * 5 + 1 = 16, outer 3 * 16 + 1 = 49.'
    },
    {
      n: 27, marks: 3, type: 'fib',
      stem: [
        { p: 'Complete the recursive function `rev(t)` which reverses a tuple.' },
        { code: 'def rev(t):\n    if not t:  # or len(t) == 0\n        return ()\n    else:\n        return {{1}} + {{2}}' }
      ],
      blanks: [
        { n: 1, answer: 'rev(t[1:])' },
        { n: 2, answer: '(t[0],)' }
      ],
      explanation: 'Recurse on the tail first so the head lands at the end. (t[0],) needs the trailing comma — without it you are adding an integer to a tuple.'
    },
    {
      n: 28, marks: 3, type: 'fib',
      stem: [
        { p: 'Define `linspace` that takes in the start, end and num (with num >= 2), so as to generate a tuple of num values between start and end, where each adjacent pair of values is equidistant apart.' },
        { code: '>>> linspace(1.0, 10.0, 10)\n(1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0)\n>>> linspace(1.0, 10.0, 9)\n(1.0, 2.125, 3.25, 4.375, 5.5, 6.625, 7.75, 8.875, 10.0)' },
        { p: 'Complete the linspace function by filling in the blank from the choices given.' },
        { code: 'def linspace(start, end, num):\n    return tuple(map(lambda i: {{1}} + start, range(num)))' }
      ],
      blanks: [
        { n: 1, answer: 'i * (end - start) / (num - 1)' }
      ],
      explanation: 'There are num - 1 equal gaps between num points, so the step size is (end - start) / (num - 1). Using num would miss the endpoint.'
    },
    {
      n: 29, marks: 3, type: 'fib',
      stem: [
        { p: 'Given the following function definition:' },
        { code: "def huu2(n):\n    if n <= 1:\n        return '1'\n    else:\n        x = huu2(n - 1) + huu2(n - 2)\n        return x + '#'" },
        { p: 'What will be returned from evaluating the following call?' },
        { code: '>>> huu2(4)' }
      ],
      blanks: [
        { n: 1, answer: "'11#1#11##'" }
      ],
      explanation: "huu2(2) = '11#', huu2(3) = '11#1#', huu2(4) = '11#1#' + '11#' + '#'."
    },
    {
      n: 30, marks: 4, type: 'fib',
      stem: [
        { p: 'A polynomial can be represented as a tuple of coefficients starting with the coefficient of the highest power. For instance, x^3 + 2x^2 - 4x + 3 is represented by (1, 2, -4, 3) and 2x^4 - x^2 + 5 is represented by (2, 0, -1, 0, 5).' },
        { p: 'Define the `polyval` function that takes in a tuple representing a polynomial followed by an iterable of values of x, and returns a tuple of evaluated values. Here are some sample runs:' },
        { code: '>>> polyval((3, 4), (0, 1, 2))\n(4, 7, 10)\n>>> polyval((-2, 0, 5), range(0, 4))\n(5, 3, -3, -13)' },
        { p: 'Complete the polyval function.' },
        { code: 'def polyval(poly, v):\n    f = lambda x: sum(map(lambda i: {{1}}, range(len(poly))))\n    return {{2}}' }
      ],
      blanks: [
        { n: 1, answer: 'poly[i] * x**(len(poly) - 1 - i)' },
        { n: 2, answer: 'tuple(map(f, v))' }
      ],
      explanation: 'Highest-power-first ordering means the exponent for index i is len(poly) - 1 - i. Blank 2 must wrap the map in tuple(), since map returns an iterator.'
    },
    {
      n: 31, marks: 4, type: 'fib',
      stem: [
        { p: 'When two polynomials (highest-power-first, as in the previous question) are added, the result is a new polynomial. For example:' },
        { code: '>>> polyadd((15, 0, -3, 15, -40), (3, 0, -2, -6))\n(15, 3, -3, 13, -46)\n>>> polyadd((3, 5, 6), (2, 8, -5))\n(5, 13, 1)' },
        { p: 'Complete the following definition of the polyadd function:' },
        { code: 'def polyadd(poly1, poly2):\n    result = ()\n    maxlen = max(len(poly1), len(poly2))\n\n    def f(poly, i):\n        return {{1}}\n\n    for i in range(1, maxlen + 1):\n        result = result + (f(poly1, i) + f(poly2, i),)\n\n    return {{2}}' }
      ],
      blanks: [
        { n: 1, answer: 'poly[-i] if i <= len(poly) else 0' },
        { n: 2, answer: 'result[::-1]' }
      ],
      explanation: 'Coefficients are consumed from the back, and a polynomial shorter than maxlen contributes 0 for the missing places. The loop builds the answer from the lowest power up, so it has to be reversed at the end.'
    }
  ]
});
