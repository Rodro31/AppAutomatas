class TuringMachine {
  constructor(inputString, maxSteps = 20000) {
    this.tape = inputString.split("");
    if (this.tape[this.tape.length - 1] !== "_") this.tape.push("_");
    this.head = 0;
    this.state = "A";
    this.history = [];
    this.maxSteps = maxSteps;
    this.transitions = this.buildTransitions();
    this.addHistory();
  }

  buildTransitions() {
    return {
      'A': { '0': ['A','0','R'], '1': ['A','1','R'], '-': ['A','-','R'], '_': ['A','_','L'] },
      'B': { '0': ['D','y','L'], '1': ['I','c','L'], '-': ['G','-','R'] },
      'C': { '-': ['C','-','R'], '0': ['C','0','R'], '1': ['C','1','R'], '|': ['C','|','R'], '%': ['C','%','R'], '#': ['C','#','R'], '&': ['C','&','R'], 'y': ['B','%','L'] },
      'D': { '0': ['D','0','L'], '1': ['D','1','L'], '-': ['E','-','L'] },
      'E': { '#': ['E','#','L'], '&': ['E','&','L'], '-': ['E','-','L'], '%': ['E','%','L'], '|': ['E','|','L'], '0': ['F','#','L'], '1': ['C','%','R'] },
      'F': { '#': ['F','#','R'], '1': ['F','1','R'], '0': ['F','0','R'], '|': ['F','|','R'], '-': ['F','-','R'], '%': ['F','%','R'], '&': ['F','&','R'], 'y': ['B','y','L'], '_': ['G','_','R'] },
      'G': { '_': ['H','_','S'] },
      'I': { '0': ['I','0','L'], '1': ['I','1','L'], '-': ['K','-','L'] },
      'J': { '|': ['J','|','R'], '-': ['J','-','R'], '1': ['J','1','R'], '&': ['J','&','R'], '0': ['J','0','R'], '%': ['J','%','R'], '#': ['J','#','R'], 'c': ['B','x','L'] },
      'K': { '#': ['K','#','L'], '&': ['K','&','L'], '%': ['K','%','L'], '|': ['K','|','L'], '1': ['J','|','R'], '0': ['M','&','L'] },
      'M': { '1': ['P','0','R'], '0': ['N','0','L'] },
      'N': { '0': ['N','0','L'], '1': ['O','0','R'] },
      'O': { '0': ['P','1','R'] },
      'P': { '0': ['P','0','R'], '%': ['P','%','R'], '&': ['P','&','R'], '|': ['P','|','R'], '-': ['P','-','R'], '#': ['P','#','R'], '1': ['P','1','R'], 'c': ['B','c','L'] }
    };
  }

  getSymbol() {
    if (this.head < 0) return '_';
    if (this.head >= this.tape.length) return '_';
    return this.tape[this.head];
  }

  setSymbol(sym) {
    if (this.head < 0) {
      const add = Array(-this.head).fill('_');
      this.tape = add.concat(this.tape);
      this.head = 0;
    }
    while (this.head >= this.tape.length) this.tape.push('_');
    this.tape[this.head] = sym;
  }

  move(dir) {
    if (dir === 'R') this.head++;
    else if (dir === 'L') this.head--;
  }

  addHistory() {
    const copy = this.tape.slice();
    if (this.head < 0) {
      const blanks = Array(-this.head).fill('_');
      copy.unshift(...blanks);
      copy.splice(0, 0, this.state);
    } else if (this.head > copy.length) {
      while (this.head > copy.length) copy.push('_');
      copy.splice(this.head, 0, this.state);
    } else {
      copy.splice(this.head, 0, this.state);
    }
    this.history.push(copy.join(''));
  }

  getTransition(state, symbol) {
    return this.transitions[state]?.[symbol];
  }

  step() {
    const sym = this.getSymbol();
    const trans = this.getTransition(this.state, sym);
    if (!trans) return false;
    const [newState, newSymbol, dir] = trans;
    this.setSymbol(newSymbol);
    this.state = newState;
    this.move(dir);
    this.addHistory();
    return true;
  }

  run() {
    let steps = 0;
    while (steps < this.maxSteps) {
      if (!this.step()) break;
      if (this.state === 'H') break;
      steps++;
    }
    if (steps >= this.maxSteps) this.history.push('... (límite de pasos alcanzado)');
    return this.history.join(' |- ');
  }
}

// Prueba con el ejemplo solicitado
const ejemplo = '1010-0011';
const tm = new TuringMachine(ejemplo + '_');
console.log('Entrada:', ejemplo);
console.log('Salida ID:\n' + tm.run());
