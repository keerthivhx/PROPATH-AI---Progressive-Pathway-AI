import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';
import { Code, CheckCircle, XCircle, Loader, ChevronRight, RefreshCw, Trophy, Lock } from 'lucide-react';

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', icon: '🟨', ext: 'js' },
  { id: 'python',     label: 'Python',     icon: '🐍', ext: 'py' },
  { id: 'java',       label: 'Java',       icon: '☕', ext: 'java' },
  { id: 'cpp',        label: 'C++',        icon: '⚡', ext: 'cpp' },
  { id: 'typescript', label: 'TypeScript', icon: '🔷', ext: 'ts' },
];

// Project tasks per domain — real challenges based on career path
const DOMAIN_TASKS = {
  default: [
    {
      id: 1, title: 'Hello World & Variables',
      description: 'Write a program that prints "Hello, ProPath!" and shows your name using a variable.',
      difficulty: 'Beginner', points: 10,
      hint: 'Use a variable to store your name, then print it with the greeting.',
      starter: { javascript: 'const name = "Your Name";\nconsole.log(`Hello, ProPath! I am ${name}`);',
                 python: 'name = "Your Name"\nprint(f"Hello, ProPath! I am {name}")',
                 java: 'public class Main {\n  public static void main(String[] args) {\n    String name = "Your Name";\n    System.out.println("Hello, ProPath! I am " + name);\n  }\n}',
                 cpp: '#include<iostream>\nusing namespace std;\nint main() {\n  string name = "Your Name";\n  cout << "Hello, ProPath! I am " << name << endl;\n  return 0;\n}',
                 typescript: 'const name: string = "Your Name";\nconsole.log(`Hello, ProPath! I am ${name}`);' }
    },
    {
      id: 2, title: 'FizzBuzz Challenge',
      description: 'Print numbers 1-30. For multiples of 3 print "Fizz", for 5 print "Buzz", for both print "FizzBuzz".',
      difficulty: 'Beginner', points: 20,
      hint: 'Use a loop and if/else conditions with modulo (%) operator.',
      starter: { javascript: 'for (let i = 1; i <= 30; i++) {\n  // your code here\n}',
                 python: 'for i in range(1, 31):\n    # your code here\n    pass',
                 java: 'public class Main {\n  public static void main(String[] args) {\n    for (int i = 1; i <= 30; i++) {\n      // your code here\n    }\n  }\n}',
                 cpp: '#include<iostream>\nusing namespace std;\nint main() {\n  for (int i = 1; i <= 30; i++) {\n    // your code here\n  }\n  return 0;\n}',
                 typescript: 'for (let i = 1; i <= 30; i++) {\n  // your code here\n}' }
    },
    {
      id: 3, title: 'Array Operations',
      description: 'Given an array [3, 7, 1, 9, 4, 6, 2, 8, 5], find the sum, average, max, and min values.',
      difficulty: 'Beginner', points: 30,
      hint: 'Use loops or built-in array functions like reduce, Math.max, Math.min.',
      starter: { javascript: 'const numbers = [3, 7, 1, 9, 4, 6, 2, 8, 5];\n// Find sum, average, max, min\n',
                 python: 'numbers = [3, 7, 1, 9, 4, 6, 2, 8, 5]\n# Find sum, average, max, min\n',
                 java: 'public class Main {\n  public static void main(String[] args) {\n    int[] numbers = {3, 7, 1, 9, 4, 6, 2, 8, 5};\n    // Find sum, average, max, min\n  }\n}',
                 cpp: '#include<iostream>\nusing namespace std;\nint main() {\n  int numbers[] = {3, 7, 1, 9, 4, 6, 2, 8, 5};\n  // Find sum, average, max, min\n  return 0;\n}',
                 typescript: 'const numbers: number[] = [3, 7, 1, 9, 4, 6, 2, 8, 5];\n// Find sum, average, max, min\n' }
    },
    {
      id: 4, title: 'Palindrome Checker',
      description: 'Write a function that checks if a given word is a palindrome (reads same forwards and backwards). Test with: "racecar", "hello", "madam".',
      difficulty: 'Intermediate', points: 40,
      hint: 'Convert to lowercase, compare string with its reverse.',
      starter: { javascript: 'function isPalindrome(word) {\n  // your code here\n  return false;\n}\nconsole.log(isPalindrome("racecar")); // true\nconsole.log(isPalindrome("hello"));   // false\nconsole.log(isPalindrome("madam"));   // true',
                 python: 'def is_palindrome(word):\n    # your code here\n    return False\n\nprint(is_palindrome("racecar"))  # True\nprint(is_palindrome("hello"))    # False\nprint(is_palindrome("madam"))    # True',
                 java: 'public class Main {\n  static boolean isPalindrome(String word) {\n    // your code here\n    return false;\n  }\n  public static void main(String[] args) {\n    System.out.println(isPalindrome("racecar"));\n    System.out.println(isPalindrome("hello"));\n  }\n}',
                 cpp: '#include<iostream>\n#include<string>\n#include<algorithm>\nusing namespace std;\nbool isPalindrome(string word) {\n  // your code here\n  return false;\n}\nint main() {\n  cout << isPalindrome("racecar") << endl;\n  return 0;\n}',
                 typescript: 'function isPalindrome(word: string): boolean {\n  // your code here\n  return false;\n}\nconsole.log(isPalindrome("racecar")); // true\nconsole.log(isPalindrome("hello"));   // false' }
    },
    {
      id: 5, title: 'Simple Calculator Class',
      description: 'Build a Calculator class/object with methods: add, subtract, multiply, divide. Include error handling for division by zero.',
      difficulty: 'Intermediate', points: 50,
      hint: 'Use OOP — create a class with methods. Throw an error if dividing by zero.',
      starter: { javascript: 'class Calculator {\n  add(a, b) { return a + b; }\n  subtract(a, b) { /* your code */ }\n  multiply(a, b) { /* your code */ }\n  divide(a, b) { /* handle division by zero! */ }\n}\nconst calc = new Calculator();\nconsole.log(calc.add(10, 5));      // 15\nconsole.log(calc.divide(10, 0));   // Error!',
                 python: 'class Calculator:\n  def add(self, a, b): return a + b\n  def subtract(self, a, b): pass  # your code\n  def multiply(self, a, b): pass  # your code\n  def divide(self, a, b): pass    # handle zero!\n\ncalc = Calculator()\nprint(calc.add(10, 5))',
                 java: 'public class Calculator {\n  public int add(int a, int b) { return a + b; }\n  public int subtract(int a, int b) { return 0; /* your code */ }\n  public int multiply(int a, int b) { return 0; /* your code */ }\n  public double divide(int a, int b) {\n    if (b == 0) throw new ArithmeticException("Cannot divide by zero");\n    return (double) a / b;\n  }\n  public static void main(String[] args) {\n    Calculator calc = new Calculator();\n    System.out.println(calc.add(10, 5));\n  }\n}',
                 cpp: '#include<iostream>\n#include<stdexcept>\nusing namespace std;\nclass Calculator {\npublic:\n  int add(int a, int b) { return a + b; }\n  int subtract(int a, int b) { return 0; }\n  int multiply(int a, int b) { return 0; }\n  double divide(int a, int b) {\n    if (b == 0) throw runtime_error("Division by zero");\n    return (double)a / b;\n  }\n};\nint main() {\n  Calculator c;\n  cout << c.add(10, 5);\n  return 0;\n}',
                 typescript: 'class Calculator {\n  add(a: number, b: number): number { return a + b; }\n  subtract(a: number, b: number): number { return 0; /* code */ }\n  multiply(a: number, b: number): number { return 0; /* code */ }\n  divide(a: number, b: number): number {\n    if (b === 0) throw new Error("Cannot divide by zero");\n    return a / b;\n  }\n}\nconst calc = new Calculator();\nconsole.log(calc.add(10, 5));' }
    },
    {
      id: 6, title: 'Todo List Manager',
      description: 'Build a TodoList with: addTask(title), removeTask(id), completeTask(id), getPending(), getCompleted(). Each task has id, title, completed status.',
      difficulty: 'Intermediate', points: 60,
      hint: 'Use an array to store tasks. Each task is an object with id, title, completed fields.',
      starter: { javascript: 'class TodoList {\n  constructor() {\n    this.tasks = [];\n    this.nextId = 1;\n  }\n  addTask(title) { /* add task object */ }\n  removeTask(id) { /* filter out by id */ }\n  completeTask(id) { /* mark as completed */ }\n  getPending() { /* return incomplete tasks */ }\n  getCompleted() { /* return completed tasks */ }\n}\nconst todo = new TodoList();\ntodo.addTask("Learn JavaScript");\ntodo.addTask("Build ProPath project");\ntodo.completeTask(1);\nconsole.log(todo.getPending());',
                 python: 'class TodoList:\n  def __init__(self):\n    self.tasks = []\n    self.next_id = 1\n  def add_task(self, title): pass\n  def remove_task(self, task_id): pass\n  def complete_task(self, task_id): pass\n  def get_pending(self): pass\n  def get_completed(self): pass\n\ntodo = TodoList()\ntodo.add_task("Learn Python")\ntodo.complete_task(1)\nprint(todo.get_completed())',
                 java: 'import java.util.*;\npublic class TodoList {\n  static class Task { int id; String title; boolean completed; }\n  private List<Task> tasks = new ArrayList<>();\n  private int nextId = 1;\n  public void addTask(String title) { /* your code */ }\n  public void removeTask(int id) { /* your code */ }\n  public void completeTask(int id) { /* your code */ }\n  public static void main(String[] args) {\n    TodoList todo = new TodoList();\n    todo.addTask("Learn Java");\n    todo.completeTask(1);\n  }\n}',
                 cpp: '#include<iostream>\n#include<vector>\n#include<string>\nusing namespace std;\nstruct Task { int id; string title; bool completed; };\nclass TodoList {\n  vector<Task> tasks;\n  int nextId = 1;\npublic:\n  void addTask(string title) { /* your code */ }\n  void completeTask(int id) { /* your code */ }\n};\nint main() {\n  TodoList todo;\n  todo.addTask("Learn C++");\n  return 0;\n}',
                 typescript: 'interface Task { id: number; title: string; completed: boolean; }\nclass TodoList {\n  private tasks: Task[] = [];\n  private nextId = 1;\n  addTask(title: string): void { /* your code */ }\n  removeTask(id: number): void { /* your code */ }\n  completeTask(id: number): void { /* your code */ }\n  getPending(): Task[] { return []; }\n  getCompleted(): Task[] { return []; }\n}\nconst todo = new TodoList();\ntodo.addTask("Learn TypeScript");' }
    },
    {
      id: 7, title: 'Number Pattern Generator',
      description: 'Generate a pyramid pattern of numbers. For n=5, print:\n1\n1 2\n1 2 3\n1 2 3 4\n1 2 3 4 5',
      difficulty: 'Beginner', points: 25,
      hint: 'Use nested loops — outer for rows, inner for columns.',
      starter: { javascript: 'function pyramid(n) {\n  for (let i = 1; i <= n; i++) {\n    // build and print each row\n  }\n}\npyramid(5);',
                 python: 'def pyramid(n):\n    for i in range(1, n + 1):\n        # build and print each row\n        pass\n\npyramid(5)',
                 java: 'public class Main {\n  public static void main(String[] args) {\n    int n = 5;\n    for (int i = 1; i <= n; i++) {\n      // build and print row\n    }\n  }\n}',
                 cpp: '#include<iostream>\nusing namespace std;\nint main() {\n  int n = 5;\n  for (int i = 1; i <= n; i++) {\n    // build and print row\n  }\n  return 0;\n}',
                 typescript: 'function pyramid(n: number): void {\n  for (let i = 1; i <= n; i++) {\n    // build and print each row\n  }\n}\npyramid(5);' }
    },
    {
      id: 8, title: 'Bank Account System',
      description: 'Build a BankAccount class with: deposit(amount), withdraw(amount), getBalance(), getHistory(). Prevent withdrawing more than balance. Log every transaction.',
      difficulty: 'Advanced', points: 80,
      hint: 'Track balance and a transactions array. Validate amounts > 0.',
      starter: { javascript: 'class BankAccount {\n  constructor(owner, initialBalance = 0) {\n    this.owner = owner;\n    this.balance = initialBalance;\n    this.history = [];\n  }\n  deposit(amount) { /* add to balance, log transaction */ }\n  withdraw(amount) { /* check sufficient funds first! */ }\n  getBalance() { return this.balance; }\n  getHistory() { return this.history; }\n}\nconst acc = new BankAccount("Keerthi", 1000);\nacc.deposit(500);\nacc.withdraw(200);\nconsole.log(acc.getBalance()); // 1300\nconsole.log(acc.getHistory());',
                 python: 'class BankAccount:\n  def __init__(self, owner, initial_balance=0):\n    self.owner = owner\n    self.balance = initial_balance\n    self.history = []\n  def deposit(self, amount): pass\n  def withdraw(self, amount): pass\n  def get_balance(self): return self.balance\n  def get_history(self): return self.history\n\nacc = BankAccount("Keerthi", 1000)\nacc.deposit(500)\nacc.withdraw(200)\nprint(acc.get_balance())',
                 java: 'import java.util.*;\npublic class BankAccount {\n  private String owner;\n  private double balance;\n  private List<String> history = new ArrayList<>();\n  public BankAccount(String owner, double initial) {\n    this.owner = owner; this.balance = initial;\n  }\n  public void deposit(double amount) { /* your code */ }\n  public void withdraw(double amount) { /* check balance! */ }\n  public double getBalance() { return balance; }\n  public static void main(String[] args) {\n    BankAccount acc = new BankAccount("Keerthi", 1000);\n    acc.deposit(500);\n    System.out.println(acc.getBalance());\n  }\n}',
                 cpp: '#include<iostream>\n#include<vector>\n#include<string>\nusing namespace std;\nclass BankAccount {\n  string owner;\n  double balance;\n  vector<string> history;\npublic:\n  BankAccount(string o, double b) : owner(o), balance(b) {}\n  void deposit(double amount) { /* your code */ }\n  void withdraw(double amount) { /* check balance! */ }\n  double getBalance() { return balance; }\n};\nint main() {\n  BankAccount acc("Keerthi", 1000);\n  acc.deposit(500);\n  cout << acc.getBalance();\n  return 0;\n}',
                 typescript: 'interface Transaction { type: "deposit"|"withdrawal"; amount: number; date: Date; }\nclass BankAccount {\n  private balance: number;\n  private history: Transaction[] = [];\n  constructor(private owner: string, initial: number = 0) {\n    this.balance = initial;\n  }\n  deposit(amount: number): void { /* your code */ }\n  withdraw(amount: number): void { /* check balance! */ }\n  getBalance(): number { return this.balance; }\n  getHistory(): Transaction[] { return this.history; }\n}\nconst acc = new BankAccount("Keerthi", 1000);\nacc.deposit(500);\nconsole.log(acc.getBalance());' }
    },
  ]
};

export default function Tasks() {
  const { user } = useStore();
  const [selectedLang, setSelectedLang] = useState('javascript');
  const [selectedTask, setSelectedTask] = useState(null);
  const [code, setCode]                 = useState('');
  const [result, setResult]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [completed, setCompleted]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('propath_completed_tasks') || '{}'); }
    catch { return {}; }
  });
  const [totalPoints, setTotalPoints]   = useState(0);

  const tasks = DOMAIN_TASKS.default;

  useEffect(() => {
    const pts = Object.entries(completed)
      .filter(([, v]) => v)
      .reduce((sum, [id]) => {
        const t = tasks.find(t => t.id === parseInt(id));
        return sum + (t?.points || 0);
      }, 0);
    setTotalPoints(pts);
  }, [completed]);

  const openTask = (task) => {
    setSelectedTask(task);
    setCode(task.starter[selectedLang] || '// Start coding here');
    setResult(null);
  };

  const handleLangChange = (lang) => {
    setSelectedLang(lang);
    if (selectedTask) setCode(selectedTask.starter[lang] || '// Start coding here');
  };

  const validateCode = async () => {
    if (!code.trim()) return toast.error('Write some code first!');
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/projects/validate-task', {
        task: selectedTask.description,
        answer: code,
        language: selectedLang
      });
      setResult(res.data);
      if (res.data.passed || res.data.correct) {
        const newCompleted = { ...completed, [selectedTask.id]: true };
        setCompleted(newCompleted);
        localStorage.setItem('propath_completed_tasks', JSON.stringify(newCompleted));
        toast.success(`+${selectedTask.points} points! Task completed! 🎉`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const diffColor = { Beginner: 'badge-green', Intermediate: 'badge-yellow', Advanced: 'badge-red' };

  if (selectedTask) {
    return (
      <div className="flex flex-col h-screen">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b" style={{ borderColor: 'rgba(99,102,241,0.15)', background: 'rgba(10,10,15,0.9)' }}>
          <button onClick={() => setSelectedTask(null)} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1">
            ← Back
          </button>
          <div className="flex-1">
            <span className="font-semibold text-white text-sm">{selectedTask.title}</span>
            <span className={`ml-2 badge ${diffColor[selectedTask.difficulty]}`}>{selectedTask.difficulty}</span>
          </div>

          {/* Language picker */}
          <div className="flex gap-1">
            {LANGUAGES.map(l => (
              <button key={l.id} onClick={() => handleLangChange(l.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedLang === l.id ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                {l.icon} {l.label}
              </button>
            ))}
          </div>

          <button onClick={validateCode} disabled={loading} className="btn-primary py-1.5 px-5 text-sm flex items-center gap-2">
            {loading ? <><span className="spinner" style={{width:14,height:14}} /> Validating...</> : '▶ Run & Validate'}
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Task description */}
          <div className="w-80 flex-shrink-0 overflow-y-auto p-4 border-r" style={{ borderColor: 'rgba(99,102,241,0.1)', background: 'rgba(10,10,15,0.7)' }}>
            <h2 className="font-bold text-white mb-2">{selectedTask.title}</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-line">{selectedTask.description}</p>

            <div className="glass-card p-3 mb-4">
              <div className="text-xs text-yellow-400 font-medium mb-1">💡 Hint</div>
              <p className="text-xs text-gray-400">{selectedTask.hint}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <Trophy size={12} className="text-yellow-400" />
              <span className="text-yellow-400 font-semibold">{selectedTask.points} points</span>
              {completed[selectedTask.id] && <span className="badge badge-green ml-1">✓ Completed</span>}
            </div>

            {/* Validation Result */}
            {result && (
              <div className={`glass-card p-4 mt-2 border ${result.passed || result.correct ? 'border-green-500/30' : 'border-red-500/30'}`}
                style={{ background: result.passed || result.correct ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)' }}>
                <div className="flex items-center gap-2 mb-2">
                  {result.passed || result.correct
                    ? <CheckCircle size={16} className="text-green-400" />
                    : <XCircle size={16} className="text-red-400" />}
                  <span className={`font-semibold text-sm ${result.passed || result.correct ? 'text-green-300' : 'text-red-300'}`}>
                    {result.passed || result.correct ? 'Passed!' : 'Needs Work'}
                  </span>
                  <span className="ml-auto text-indigo-400 font-bold text-sm">{result.score}/10</span>
                </div>
                <p className="text-xs text-gray-300 mb-2">{result.feedback}</p>
                {result.improvements?.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Improvements:</div>
                    {result.improvements.slice(0,3).map((imp, i) => (
                      <div key={i} className="text-xs text-gray-400 flex gap-1">• {imp}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={selectedLang}
              value={code}
              onChange={v => setCode(v || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontLigatures: true,
                lineNumbers: 'on',
                automaticLayout: true,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── TASK LIST ──────────────────────────────────────────────────────────────
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Learning Tasks</h1>
          <p className="text-gray-400 text-sm mt-1">Build real projects • Choose your language • Get AI feedback</p>
        </div>
        <div className="glass-card px-5 py-3 flex items-center gap-2">
          <Trophy size={18} className="text-yellow-400" />
          <span className="text-yellow-400 font-bold text-lg">{totalPoints}</span>
          <span className="text-gray-400 text-sm">points</span>
        </div>
      </div>

      {/* Language selector */}
      <div className="glass-card p-4 mb-6">
        <div className="text-sm text-gray-400 mb-3 font-medium">Choose your language:</div>
        <div className="flex gap-2 flex-wrap">
          {LANGUAGES.map(l => (
            <button key={l.id} onClick={() => setSelectedLang(l.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${selectedLang === l.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              <span>{l.icon}</span> {l.label}
              {selectedLang === l.id && <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">Selected</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="glass-card p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-300">Overall Progress</span>
          <span className="text-indigo-400">{Object.values(completed).filter(Boolean).length} / {tasks.length} tasks</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(Object.values(completed).filter(Boolean).length / tasks.length) * 100}%` }} />
        </div>
      </div>

      {/* Tasks grid */}
      <div className="grid grid-cols-2 gap-4">
        {tasks.map((task, i) => {
          const done = completed[task.id];
          const locked = i > 0 && !completed[tasks[i-1].id] && !done;
          return (
            <div key={task.id}
              onClick={() => !locked && openTask(task)}
              className={`glass-card p-5 transition-all ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5'} ${done ? 'border-green-500/30' : ''}`}
              style={done ? { borderColor: 'rgba(16,185,129,0.3)' } : {}}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${done ? 'bg-green-500/20 text-green-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                    {done ? '✓' : task.id}
                  </div>
                  <span className={`badge ${diffColor[task.difficulty]}`}>{task.difficulty}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-xs font-semibold flex items-center gap-1">
                    <Trophy size={11} /> {task.points}pts
                  </span>
                  {locked && <Lock size={14} className="text-gray-600" />}
                  {!locked && !done && <ChevronRight size={14} className="text-gray-500" />}
                </div>
              </div>
              <h3 className="font-semibold text-white text-sm mb-1">{task.title}</h3>
              <p className="text-gray-500 text-xs line-clamp-2">{task.description}</p>
              {!locked && !done && (
                <div className="mt-3 text-xs text-indigo-400 flex items-center gap-1">
                  <Code size={11} /> Click to start coding in {LANGUAGES.find(l => l.id === selectedLang)?.label}
                </div>
              )}
              {done && <div className="mt-3 text-xs text-green-400 flex items-center gap-1"><CheckCircle size={11} /> Completed</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
