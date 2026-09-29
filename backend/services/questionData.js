const QUESTIONS_DATA = [
  {
    "conceptSlug": "programming-basics",
    "question": "Which component in the Java architecture executes compiled Java bytecode (*.class) on the host operating system?",
    "type": "MCQ",
    "difficulty": 1,
    "options": [
      "Java Development Kit (JDK)",
      "Java Virtual Machine (JVM)",
      "Java Compiler (javac)",
      "Java Runtime Environment Libraries only"
    ],
    "correctAnswer": "Java Virtual Machine (JVM)",
    "explanation": "The JVM provides the runtime environment for executing compiled Java bytecode by converting it to machine-specific instructions."
  },
  {
    "conceptSlug": "programming-basics",
    "question": "Analyze this basic Java application code. What will be printed to standard output?",
    "type": "Code Output",
    "difficulty": 2,
    "codeSnippet": "public class Main {\n    public static void main(String[] args) {\n        System.out.print(\"Java \");\n        System.out.println(\"21\");\n    }\n}",
    "options": [
      "Java\n21",
      "Java 21",
      "Java21",
      "Compile error: print method missing newline"
    ],
    "correctAnswer": "Java 21",
    "explanation": "System.out.print does not add a newline; the subsequent System.out.println outputs \"21\" on the exact same line, yielding \"Java 21\"."
  },
  {
    "conceptSlug": "programming-basics",
    "question": "Locate the syntax defect in this Java class definition preventing compilation.",
    "type": "Debugging",
    "difficulty": 2,
    "codeSnippet": "class App {\n    public void main(String args) {\n        System.out.println(\"Ready\");\n    }\n}",
    "options": [
      "The main method must return int instead of void",
      "The main method must be declared static and accept String[] args",
      "The class App must be declared abstract",
      "System.out cannot output string literals directly"
    ],
    "correctAnswer": "The main method must be declared static and accept String[] args",
    "explanation": "The JVM entrypoint signature requires: public static void main(String[] args). Without static and an array of Strings, the JVM cannot invoke it as the entrypoint."
  },
  {
    "conceptSlug": "variables-datatypes",
    "question": "In standard Java, what is the default value of an uninitialized instance variable of primitive type int and reference type String?",
    "type": "MCQ",
    "difficulty": 1,
    "options": [
      "0 and \"\"",
      "0 and null",
      "undefined and null",
      "garbage memory value for both"
    ],
    "correctAnswer": "0 and null",
    "explanation": "Java automatically initializes instance fields: numeric primitives default to 0, while all object references default to null."
  },
  {
    "conceptSlug": "variables-datatypes",
    "question": "What is the exact output of this integer casting and overflow scenario in Java?",
    "type": "Code Output",
    "difficulty": 3,
    "codeSnippet": "byte b = 127;\nb++;\nSystem.out.println(b);",
    "options": [
      "128",
      "-128",
      "Compile error: cannot increment byte",
      "ArithmeticException"
    ],
    "correctAnswer": "-128",
    "explanation": "Java bytes are signed 8-bit integers (-128 to 127). Incrementing 127 wraps around in two's complement binary representation to -128."
  },
  {
    "conceptSlug": "variables-datatypes",
    "question": "You need to store financial currency transactions where rounding errors are strictly impermissible. Which type must you select?",
    "type": "Scenario",
    "difficulty": 3,
    "options": [
      "double",
      "float",
      "java.math.BigDecimal",
      "long representing cents multiplied by 1000"
    ],
    "correctAnswer": "java.math.BigDecimal",
    "explanation": "IEEE 754 floating-point types (float and double) suffer from binary representation imprecision for decimal fractions. BigDecimal provides arbitrary precision arithmetic."
  },
  {
    "conceptSlug": "operators",
    "question": "What is the output of the following short-circuit logical operation?",
    "type": "Code Output",
    "difficulty": 2,
    "codeSnippet": "int a = 5;\nboolean result = (a > 10) && (++a > 5);\nSystem.out.println(a + \" \" + result);",
    "options": [
      "5 false",
      "6 false",
      "6 true",
      "5 true"
    ],
    "correctAnswer": "5 false",
    "explanation": "Because (a > 10) is false, the logical AND (&&) short-circuits and never executes the right-hand operand (++a). Thus a remains 5."
  },
  {
    "conceptSlug": "operators",
    "question": "Evaluate the precedence and result of this expression in Java:",
    "type": "Code Output",
    "difficulty": 3,
    "codeSnippet": "int x = 10;\nint y = ++x * 2;\nSystem.out.println(x + \",\" + y);",
    "options": [
      "10,20",
      "11,20",
      "11,22",
      "10,22"
    ],
    "correctAnswer": "11,22",
    "explanation": "Pre-increment (++x) increments x to 11 before evaluating multiplication. Then 11 * 2 equals 22."
  },
  {
    "conceptSlug": "operators",
    "question": "Why does (\"Hello\" == new String(\"Hello\")) evaluate to false in Java, while (\"Hello\".equals(new String(\"Hello\"))) evaluates to true?",
    "type": "MCQ",
    "difficulty": 3,
    "options": [
      "== compares object heap memory references, whereas .equals() compares string character contents",
      "== is an obsolete operator in modern Java versions",
      "new String creates a mutable character sequence",
      ".equals checks hashCode only"
    ],
    "correctAnswer": "== compares object heap memory references, whereas .equals() compares string character contents",
    "explanation": "The == operator tests reference identity (do both variables point to the exact same memory address). The .equals() method in String is overridden to compare character sequences."
  },
  {
    "conceptSlug": "conditionals",
    "question": "Predict the console output of this switch statement without breaks:",
    "type": "Code Output",
    "difficulty": 2,
    "codeSnippet": "int code = 2;\nswitch(code) {\n    case 1: System.out.print(\"A\");\n    case 2: System.out.print(\"B\");\n    case 3: System.out.print(\"C\");\n    default: System.out.print(\"D\");\n}",
    "options": [
      "B",
      "BCD",
      "BC",
      "BD"
    ],
    "correctAnswer": "BCD",
    "explanation": "Because case 2 lacks a break statement, execution falls through into case 3 and default, printing \"BCD\"."
  },
  {
    "conceptSlug": "conditionals",
    "question": "Diagnose the logic error in this discount evaluation method:",
    "type": "Debugging",
    "difficulty": 3,
    "codeSnippet": "public double getDiscount(int age) {\n    if (age > 60) return 0.20;\n    else if (age > 18) return 0.10;\n    else if (age > 75) return 0.30;\n    return 0.0;\n}",
    "options": [
      "Senior discount for age > 75 is unreachable dead logic because age > 60 matches first",
      "The method must return an integer percentage",
      "else if cannot follow an if block",
      "The age parameter cannot be compared with relational operators"
    ],
    "correctAnswer": "Senior discount for age > 75 is unreachable dead logic because age > 60 matches first",
    "explanation": "Since 76 > 60, any age greater than 75 triggers the first if branch (age > 60) and returns 0.20, never reaching the age > 75 branch."
  },
  {
    "conceptSlug": "conditionals",
    "question": "Which of the following types is NOT supported as a switch expression selector prior to Java 7?",
    "type": "MCQ",
    "difficulty": 2,
    "options": [
      "String",
      "int",
      "char",
      "byte"
    ],
    "correctAnswer": "String",
    "explanation": "Support for switching on String values was introduced in Java 7. Prior versions supported only byte, short, char, int, and enum."
  },
  {
    "conceptSlug": "loops",
    "question": "How many iterations does this while loop execute before terminating?",
    "type": "Code Output",
    "difficulty": 2,
    "codeSnippet": "int count = 1;\nwhile (count <= 16) {\n    count *= 2;\n}\nSystem.out.println(count);",
    "options": [
      "4 iterations, prints 16",
      "4 iterations, prints 32",
      "5 iterations, prints 32",
      "Infinite loop"
    ],
    "correctAnswer": "5 iterations, prints 32",
    "explanation": "Values of count at loop start: 1 (iter 1 -> 2), 2 (iter 2 -> 4), 4 (iter 3 -> 8), 8 (iter 4 -> 16), 16 (iter 5 -> 32). Terminates at count = 32."
  },
  {
    "conceptSlug": "loops",
    "question": "A learner wrote this nested loop to search for a target coordinate in a 2D matrix. How should they immediately break out of BOTH loops upon finding the match?",
    "type": "Scenario",
    "difficulty": 3,
    "options": [
      "Use a labeled break statement (e.g. break searchLoop;)",
      "Use return null inside the loop and catch it",
      "Use continue with a flag variable",
      "It is impossible to break out of nested loops in Java without System.exit"
    ],
    "correctAnswer": "Use a labeled break statement (e.g. break searchLoop;)",
    "explanation": "Java supports labeled statements (e.g., outer: for (...) { for (...) { if (found) break outer; } }) allowing immediate termination of nested loop blocks."
  },
  {
    "conceptSlug": "loops",
    "question": "What is the exact output of this loop with continue and break statements?",
    "type": "Code Output",
    "difficulty": 3,
    "codeSnippet": "int sum = 0;\nfor (int i = 0; i < 6; i++) {\n    if (i % 2 == 0) continue;\n    if (i == 5) break;\n    sum += i;\n}\nSystem.out.println(sum);",
    "options": [
      "4",
      "1",
      "9",
      "0"
    ],
    "correctAnswer": "4",
    "explanation": "i=0 (continue), i=1 (sum=1), i=2 (continue), i=3 (sum=1+3=4), i=4 (continue), i=5 (break loop). Output is 4."
  },
  {
    "conceptSlug": "loops",
    "question": "Transfer Task: Given an array of integers, convert this O(N^2) brute-force duplicate check into an O(N) single-pass approach using loops and memory:",
    "type": "Transfer",
    "difficulty": 4,
    "options": [
      "Sort the array and compare adjacent elements in a single loop",
      "Track seen elements in a HashSet during one iteration",
      "Use a do-while loop instead of for loop",
      "Both A and B are valid transfer strategies with superior time complexity"
    ],
    "correctAnswer": "Both A and B are valid transfer strategies with superior time complexity",
    "explanation": "A HashSet provides O(N) average time complexity, while sorting + adjacent check provides O(N log N). Both eliminate the quadratic nested loop."
  },
  {
    "conceptSlug": "functions",
    "question": "In Java, what happens when an object reference is passed into a method as an argument?",
    "type": "MCQ",
    "difficulty": 2,
    "options": [
      "The object is passed by reference; reassigning the variable reassigns the caller variable",
      "Java is strictly pass-by-value: a copy of the reference address is passed",
      "Primitives are pass-by-value, objects are strictly pass-by-reference",
      "A deep clone of the entire object graph is automatically created"
    ],
    "correctAnswer": "Java is strictly pass-by-value: a copy of the reference address is passed",
    "explanation": "Java is 100% pass-by-value. When passing an object, the value of the reference (pointer address) is copied. Mutating the object state affects the caller, but reassigning the reference itself does not."
  },
  {
    "conceptSlug": "functions",
    "question": "What is the output of this method overloading scenario?",
    "type": "Code Output",
    "difficulty": 3,
    "codeSnippet": "public class Test {\n    static void print(int x) { System.out.print(\"int \"); }\n    static void print(long x) { System.out.print(\"long \"); }\n    static void print(Integer x) { System.out.print(\"Integer \"); }\n    public static void main(String[] args) {\n        print(10);\n    }\n}",
    "options": [
      "int ",
      "long ",
      "Integer ",
      "Ambiguous method compile error"
    ],
    "correctAnswer": "int ",
    "explanation": "Java method resolution selects the most specific match without boxing or widening first: an exact primitive int match takes precedence over primitive widening (long) or autoboxing (Integer)."
  },
  {
    "conceptSlug": "functions",
    "question": "Calculate the return value of this recursive function for compute(4):",
    "type": "Code Output",
    "difficulty": 4,
    "codeSnippet": "public static int compute(int n) {\n    if (n <= 1) return 1;\n    return n * compute(n - 1);\n}",
    "options": [
      "24",
      "10",
      "16",
      "120"
    ],
    "correctAnswer": "24",
    "explanation": "compute(4) computes factorial: 4 * 3 * 2 * 1 = 24."
  },
  {
    "conceptSlug": "oop-basics",
    "question": "Where are Java local variables versus Java heap objects stored during execution?",
    "type": "MCQ",
    "difficulty": 2,
    "options": [
      "Local variables on Thread Call Stack; dynamically allocated objects on the Garbage Collected Heap",
      "Both reside on the Heap",
      "Both reside on the CPU Call Stack",
      "Primitives on Heap, Objects on Stack"
    ],
    "correctAnswer": "Local variables on Thread Call Stack; dynamically allocated objects on the Garbage Collected Heap",
    "explanation": "Method execution frames and their local variables reside on the Thread Call Stack. All objects instantiated via \"new\" reside in Heap memory."
  },
  {
    "conceptSlug": "oop-basics",
    "question": "What is the console output of this constructor chaining snippet?",
    "type": "Code Output",
    "difficulty": 3,
    "codeSnippet": "class Box {\n    int length;\n    Box() {\n        this(5);\n        System.out.print(\"Default \");\n    }\n    Box(int l) {\n        this.length = l;\n        System.out.print(l + \" \");\n    }\n}\npublic class Main {\n    public static void main(String[] args) {\n        new Box();\n    }\n}",
    "options": [
      "Default 5 ",
      "5 Default ",
      "5 ",
      "Default "
    ],
    "correctAnswer": "5 Default ",
    "explanation": "The no-arg constructor invokes this(5) first before executing its body. Box(int) runs and prints \"5 \", then Box() finishes and prints \"Default \"."
  },
  {
    "conceptSlug": "oop-basics",
    "question": "Debug the compilation failure in this class definition:",
    "type": "Debugging",
    "difficulty": 3,
    "codeSnippet": "class Counter {\n    int count = 0;\n    public static void increment() {\n        this.count++;\n    }\n}",
    "options": [
      "Cannot use \"this\" or access non-static instance field \"count\" from a static method context",
      "The method must return an int",
      "count variable must be public",
      "increment cannot be declared static"
    ],
    "correctAnswer": "Cannot use \"this\" or access non-static instance field \"count\" from a static method context",
    "explanation": "Static methods belong to the class, not to any specific instance. Therefore, the \"this\" keyword and non-static instance variables cannot be referenced directly."
  },
  {
    "conceptSlug": "encapsulation",
    "question": "Which design pattern best guarantees class immutability under encapsulation?",
    "type": "Scenario",
    "difficulty": 3,
    "options": [
      "Make all fields private final, provide no setters, and return defensive copies of mutable reference fields",
      "Make all fields public final",
      "Provide public synchronized getters and setters",
      "Make the class abstract with protected fields"
    ],
    "correctAnswer": "Make all fields private final, provide no setters, and return defensive copies of mutable reference fields",
    "explanation": "True immutability requires private final fields, no mutator methods, and defensive copies of any mutable internal components (like Date or arrays)."
  },
  {
    "conceptSlug": "encapsulation",
    "question": "What visibility does a member variable have if no access modifier (private, protected, public) is specified?",
    "type": "MCQ",
    "difficulty": 2,
    "options": [
      "Package-private (visible to classes within the same package)",
      "Private to the class only",
      "Public to the entire project",
      "Protected to subclasses across all packages"
    ],
    "correctAnswer": "Package-private (visible to classes within the same package)",
    "explanation": "Default access (no modifier) is package-private, meaning only classes residing in the exact same package can access the member."
  },
  {
    "conceptSlug": "encapsulation",
    "question": "Transfer Task: Encapsulate this mutable Person class so external callers cannot modify the internal hobbies list:",
    "type": "Transfer",
    "difficulty": 4,
    "codeSnippet": "public class Person {\n    private List<String> hobbies;\n    public List<String> getHobbies() { return hobbies; }\n}",
    "options": [
      "Return Collections.unmodifiableList(hobbies) or new ArrayList<>(hobbies)",
      "Make hobbies public static",
      "Change List to String[]",
      "Make Person an abstract class"
    ],
    "correctAnswer": "Return Collections.unmodifiableList(hobbies) or new ArrayList<>(hobbies)",
    "explanation": "Returning an unmodifiable view or a defensive copy prevents callers from mutating the private internal list reference."
  },
  {
    "conceptSlug": "inheritance",
    "question": "What will this polymorphic code output?",
    "type": "Code Output",
    "difficulty": 3,
    "codeSnippet": "class Animal {\n    void speak() { System.out.print(\"Animal \"); }\n}\nclass Dog extends Animal {\n    void speak() { System.out.print(\"Bark \"); }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Animal a = new Dog();\n        a.speak();\n    }\n}",
    "options": [
      "Animal ",
      "Bark ",
      "Animal Bark ",
      "Compile error: type mismatch"
    ],
    "correctAnswer": "Bark ",
    "explanation": "Java resolves non-static method calls using dynamic method dispatch (runtime polymorphism). Because the actual instance on the heap is a Dog, Dog.speak() executes."
  },
  {
    "conceptSlug": "inheritance",
    "question": "What occurs when a subclass constructor does not explicitly invoke super() or this()?",
    "type": "MCQ",
    "difficulty": 2,
    "options": [
      "The compiler automatically inserts super() to call the parent no-argument constructor as the first statement",
      "The parent class constructor is never executed",
      "Compile error occurs in all cases",
      "The subclass instance shares memory with parent without initialization"
    ],
    "correctAnswer": "The compiler automatically inserts super() to call the parent no-argument constructor as the first statement",
    "explanation": "If a constructor does not explicitly call super(...) or this(...), javac automatically inserts an implicit call to super() as its first statement."
  },
  {
    "conceptSlug": "inheritance",
    "question": "Transfer Task: You need a base type that enforces contract method implementation while providing reusable shared concrete methods. Why choose an abstract class over a pure interface prior to Java 8, and when should you prefer an interface today?",
    "type": "Transfer",
    "difficulty": 4,
    "options": [
      "Abstract classes allow state (non-static instance fields), whereas interfaces enforce stateless contracts across unrelated classes",
      "Interfaces are always faster at runtime",
      "Abstract classes support multiple inheritance",
      "Interfaces cannot define constant values"
    ],
    "correctAnswer": "Abstract classes allow state (non-static instance fields), whereas interfaces enforce stateless contracts across unrelated classes",
    "explanation": "Abstract classes can hold mutable instance state and constructor logic for close IS-A hierarchies. Interfaces define behavioral contracts for diverse, unrelated types."
  },
  {
    "conceptSlug": "collections",
    "question": "What is the average time complexity for key lookup, insertion, and deletion in a java.util.HashMap with a well-distributed hash function?",
    "type": "MCQ",
    "difficulty": 2,
    "options": [
      "O(1)",
      "O(log N)",
      "O(N)",
      "O(N log N)"
    ],
    "correctAnswer": "O(1)",
    "explanation": "HashMap calculates the bucket index from hashCode() in O(1) time. With minimal collisions, get() and put() run in constant O(1) time."
  },
  {
    "conceptSlug": "collections",
    "question": "What will be printed by this HashSet operation?",
    "type": "Code Output",
    "difficulty": 3,
    "codeSnippet": "java.util.Set<String> set = new java.util.HashSet<>();\nset.add(\"Apple\");\nset.add(\"Banana\");\nset.add(\"Apple\");\nSystem.out.println(set.size());",
    "options": [
      "3",
      "2",
      "1",
      "NullPointerException"
    ],
    "correctAnswer": "2",
    "explanation": "A HashSet enforces uniqueness and does not permit duplicates. Adding \"Apple\" a second time returns false and leaves the set size at 2."
  },
  {
    "conceptSlug": "collections",
    "question": "Debug this concurrent iteration code. What exception is thrown at runtime?",
    "type": "Debugging",
    "difficulty": 4,
    "codeSnippet": "java.util.List<String> list = new java.util.ArrayList<>(java.util.List.of(\"A\", \"B\", \"C\"));\nfor (String item : list) {\n    if (item.equals(\"B\")) {\n        list.remove(item);\n    }\n}",
    "options": [
      "ConcurrentModificationException",
      "IndexOutOfBoundsException",
      "UnsupportedOperationException",
      "NullPointerException"
    ],
    "correctAnswer": "ConcurrentModificationException",
    "explanation": "Modifying an ArrayList directly while iterating over it with an enhanced for-loop invalidates the iterator modCount, throwing ConcurrentModificationException."
  },
  {
    "conceptSlug": "collections",
    "question": "Transfer Task: You need a collection that maintains elements in sorted order while allowing O(log N) insertion and contains checks. Which collection is optimal?",
    "type": "Transfer",
    "difficulty": 4,
    "options": [
      "java.util.TreeSet (backed by a Red-Black Tree)",
      "java.util.ArrayList with Collections.sort called after every insertion",
      "java.util.LinkedHashSet",
      "java.util.PriorityQueue without iterator order"
    ],
    "correctAnswer": "java.util.TreeSet (backed by a Red-Black Tree)",
    "explanation": "TreeSet implements NavigableSet backed by a Red-Black Tree, guaranteeing log(n) time cost for basic operations while keeping elements sorted."
  },
  {
    "conceptSlug": "exception-handling",
    "question": "Predict the console output of this try-catch-finally block:",
    "type": "Code Output",
    "difficulty": 3,
    "codeSnippet": "try {\n    int x = 10 / 0;\n} catch (ArithmeticException e) {\n    System.out.print(\"Caught \");\n} finally {\n    System.out.print(\"Finally \");\n}",
    "options": [
      "Caught Finally ",
      "Caught ",
      "Finally ",
      "Uncaught ArithmeticException"
    ],
    "correctAnswer": "Caught Finally ",
    "explanation": "The division by zero throws ArithmeticException, caught by the catch block printing \"Caught \". The finally block is guaranteed to execute, printing \"Finally \"."
  },
  {
    "conceptSlug": "exception-handling",
    "question": "What is the primary difference between Checked exceptions and Unchecked (RuntimeException) in Java?",
    "type": "MCQ",
    "difficulty": 2,
    "options": [
      "Checked exceptions are validated at compile time and must be handled or declared via throws; Unchecked exceptions represent bugs or unrecoverable states",
      "Checked exceptions crash the JVM immediately",
      "Unchecked exceptions cannot be caught in a try-catch block",
      "Checked exceptions are deprecated in modern Java"
    ],
    "correctAnswer": "Checked exceptions are validated at compile time and must be handled or declared via throws; Unchecked exceptions represent bugs or unrecoverable states",
    "explanation": "Checked exceptions (inheriting directly from Exception) require explicit handling or propagation. Unchecked exceptions (inheriting from RuntimeException or Error) do not."
  },
  {
    "conceptSlug": "exception-handling",
    "question": "Scenario: You are reading lines from a database or file stream. Why is try-with-resources preferred over standard try-finally?",
    "type": "Scenario",
    "difficulty": 3,
    "options": [
      "It guarantees automatic closure of any AutoCloseable resource even if exceptions occur, avoiding resource leaks",
      "It suppresses all exceptions automatically",
      "It increases stream throughput by 50%",
      "It does not require catch blocks"
    ],
    "correctAnswer": "It guarantees automatic closure of any AutoCloseable resource even if exceptions occur, avoiding resource leaks",
    "explanation": "Try-with-resources guarantees that all declared AutoCloseable resources are safely closed in reverse order of declaration, even when exceptions are thrown."
  },
  {
    "conceptSlug": "problem-solving",
    "question": "Transfer Task: You must find the first non-repeating character in a 1,000,000 character stream in O(N) time and minimal memory. Which combination of concepts provides the optimal architecture?",
    "type": "Transfer",
    "difficulty": 5,
    "options": [
      "A LinkedHashMap or integer array frequency table (int[256]) to record counts while preserving insertion order",
      "Sort the stream alphabetically with Collections.sort",
      "Two nested loops scanning backwards from the end",
      "An ArrayList with linear index scans"
    ],
    "correctAnswer": "A LinkedHashMap or integer array frequency table (int[256]) to record counts while preserving insertion order",
    "explanation": "An integer frequency array or LinkedHashMap processes characters in O(N) single pass and preserves order, enabling O(1) retrieval of the first count == 1."
  },
  {
    "conceptSlug": "problem-solving",
    "question": "A critical financial order processor fails intermittently with \"OutOfMemoryError: Java heap space\". Memory dump analysis reveals millions of Order objects in a static ArrayList cache. What is the fundamental software engineering flaw?",
    "type": "Scenario",
    "difficulty": 4,
    "options": [
      "Memory leak caused by unmanaged static reference keeping objects GC-reachable indefinitely",
      "The JVM cannot allocate more than 64MB of heap memory",
      "Static collections cannot store user-defined objects",
      "ArrayList must be replaced with Vector"
    ],
    "correctAnswer": "Memory leak caused by unmanaged static reference keeping objects GC-reachable indefinitely",
    "explanation": "In Java, static roots remain alive for the lifetime of the ClassLoader. Storing unbounded objects in static collections prevents garbage collection, resulting in a persistent memory leak."
  },
  {
    "conceptSlug": "problem-solving",
    "question": "Evaluate this LRU cache eviction logic. Which data structure combination provides O(1) get and O(1) put operations?",
    "type": "Coding",
    "difficulty": 5,
    "options": [
      "HashMap combined with a Doubly Linked List",
      "Single LinkedList with binary search",
      "TreeSet with comparator",
      "PriorityQueue with array backing"
    ],
    "correctAnswer": "HashMap combined with a Doubly Linked List",
    "explanation": "A HashMap provides O(1) node lookup by key. A Doubly Linked List allows O(1) removal and repositioning of nodes to the head/tail during cache hits or evictions."
  },
  {
    "conceptSlug": "functions",
    "question": "Debug this recursive factorial function. For which input values does it fail with StackOverflowError?",
    "type": "Debugging",
    "difficulty": 3,
    "codeSnippet": "public static int fact(int n) {\n    if (n == 0) return 1;\n    return n * fact(n - 1);\n}",
    "options": [
      "Negative integers (e.g. n = -1) because the base case n == 0 is never reached",
      "n = 0",
      "n = 1",
      "Positive even integers"
    ],
    "correctAnswer": "Negative integers (e.g. n = -1) because the base case n == 0 is never reached",
    "explanation": "Calling fact with negative numbers decrements indefinitely (-1, -2, -3...), exhausting the Call Stack and throwing StackOverflowError."
  },
  {
    "conceptSlug": "encapsulation",
    "question": "Which method properly implements defensive copying for a Date object returned from an encapsulated class getter?",
    "type": "Coding",
    "difficulty": 3,
    "codeSnippet": "public Date getBirthDate() {\n    return new Date(this.birthDate.getTime());\n}",
    "options": [
      "new Date(this.birthDate.getTime()) creates an independent instance protecting internal state",
      "return this.birthDate directly",
      "return null if birthDate is set",
      "return (Date) this.birthDate.clone() without null check"
    ],
    "correctAnswer": "new Date(this.birthDate.getTime()) creates an independent instance protecting internal state",
    "explanation": "java.util.Date is mutable. Returning a new Date instance initialized with the timestamp protects the internal field from outside mutation."
  },
  {
    "conceptSlug": "collections",
    "question": "Transfer Task: Compare ArrayList vs LinkedList when repeatedly inserting 100,000 items strictly at index 0:",
    "type": "Transfer",
    "difficulty": 4,
    "options": [
      "LinkedList runs in O(1) per prepend insertion (O(N) total), whereas ArrayList incurs O(N) array shifts per insertion (O(N^2) total)",
      "ArrayList is faster due to CPU cache locality in all cases",
      "Both exhibit identical O(1) performance",
      "LinkedList throws OutOfMemoryError for index 0 insertions"
    ],
    "correctAnswer": "LinkedList runs in O(1) per prepend insertion (O(N) total), whereas ArrayList incurs O(N) array shifts per insertion (O(N^2) total)",
    "explanation": "Inserting at index 0 in LinkedList simply updates the head pointer in O(1) time. ArrayList must shift all N existing array elements right on every insertion, resulting in quadratic O(N^2) behavior."
  },
  {
    "conceptSlug": "problem-solving",
    "question": "Transfer Task: Detect whether a singly linked list contains a cycle using O(1) additional memory:",
    "type": "Transfer",
    "difficulty": 4,
    "options": [
      "Floyd's Cycle-Finding Algorithm (slow pointer moving 1 step and fast pointer moving 2 steps until collision)",
      "Store visited node references in a HashSet",
      "Count nodes and stop at Integer.MAX_VALUE",
      "Reverse the list and compare head pointers"
    ],
    "correctAnswer": "Floyd's Cycle-Finding Algorithm (slow pointer moving 1 step and fast pointer moving 2 steps until collision)",
    "explanation": "Floyd's two-pointer algorithm detects loops in O(N) time using strictly O(1) additional memory by detecting pointer collision."
  }
];

module.exports = { QUESTIONS_DATA };
