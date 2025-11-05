// Simulador completo de la Máquina de Turing con generación de ID paso a paso
document.getElementById("btnGenerar").addEventListener("click", generarID);

// Permite seleccionar/usar una cadena de prueba desde la columna izquierda.
function selectSample(value) {
  const input = document.getElementById('txtEntrada');
  const salida = document.getElementById('lblResultado');
  if (input) input.value = value;
  // Intentar copiar al portapapeles si está disponible
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(value).then(() => {
      if (salida) {
        const prev = salida.innerText;
        salida.innerText = 'Copiado: ' + value;
        setTimeout(() => { salida.innerText = prev; }, 1200);
      }
    }).catch(() => {
      // ignore copy errors
    });
  } else {
    // Fallback: seleccionar el texto del input para que el usuario lo copie
    if (input) {
      input.select && input.select();
    }
  }
}

class TuringMachine {
  // inputString: cadena original sin marcador final
  // options: { maxSteps, mode: 'completa'|'ventana', windowSize }
  constructor(inputString, options = {}) {
    const { mode = 'completa', windowSize = 3 } = options;
    const { debug = false } = options;
    this.baseLength = inputString.length; // longitud original (sin blanks añadidos)
    // Preparamos la cinta: caracteres originales más un blanco al final
    this.tape = inputString.split("");
    if (this.tape[this.tape.length - 1] !== "_") {
      this.tape.push("_");
    }
    this.head = 0; // posición del cabezal (empezamos en el primer carácter)
    this.state = "A";
    this.history = [];
    this.mode = mode;
    this.windowSize = windowSize;
    this.debug = debug;
    this.stepCount = 0;
    this.transitions = this.buildTransitions();
    this.addHistory();
  }

  // Construye la tabla de transiciones a partir de la descripción dada
  buildTransitions() {
    // Tabla de transiciones exactamente como S proporcionada
    return {
      'A': {
        '0': ['A','0','R'],
        '1': ['A','1','R'],
        '-': ['A','-','R'],
        '_': ['B','_','L']
      },
      'B': {
        '0': ['D','y','L'],
        '1': ['I','c','L'],
        '-': ['G','-','R']
      },
      'C': {
        '-': ['C','-','R'],
        '0': ['C','0','R'],
        '1': ['C','1','R'],
        '|': ['C','|','R'],
        '%': ['C','%','R'],
        '#': ['C','#','R'],
        '&': ['C','&','R'],
        'y': ['B','%','L']
      },
      'D': {
        '0': ['D','0','L'],
        '1': ['D','1','L'],
        '-': ['E','-','L']
      },
      'E': {
        '#': ['E','#','L'],
        '&': ['E','&','L'],
        '-': ['E','-','L'],
        '%': ['E','%','L'],
        '|': ['E','|','L'],
        '0': ['F','#','L'],
        '1': ['C','%','R']
      },
      'F': {
        '#': ['F','#','R'],
        '1': ['F','1','R'],
        '0': ['F','0','R'],
        '|': ['F','|','R'],
        '-': ['F','-','R'],
        '%': ['F','%','R'],
        '&': ['F','&','R'],
        'y': ['B','y','L'],
        '_': ['G','_','R']
      },
      'G': {
        '_': ['H','_','S'],
        'c': ['G','1','R'],
        'y': ['G','0','R'],
        'x': ['G','0','R'],
        '%': ['G','1','R'],
        '&': ['G','&','R'],
        '-': ['G','-','R'],
        '|': ['G','|','R'],
        '#': ['G','#','R'],
        '0': ['G','0','R'],
        '1': ['G','1','R']
      },
      'H': {},
      'I': {
        '0': ['I','0','L'],
        '1': ['I','1','L'],
        '-': ['K','-','L']
      },
      'J': {
        '|': ['J','|','R'],
        '-': ['J','-','R'],
        '1': ['J','1','R'],
        '&': ['J','&','R'],
        '0': ['J','0','R'],
        '%': ['J','%','R'],
        '#': ['J','#','R'],
        'c': ['B','x','L']
      },
      'K': {
        '#': ['K','#','L'],
        '&': ['K','&','L'],
        '%': ['K','%','L'],
        '|': ['K','|','L'],
        '1': ['J','|','R'],
        '0': ['M','&','L']
      },
      'M': {
        '1': ['P','0','R'],
        '0': ['N','0','L']
      },
      'N': {
        '0': ['N','0','L'],
        '1': ['O','0','R']
      },
      'O': {
        '0': ['P','1','R']
      },
      'P': {
        '0': ['P','0','R'],
        '%': ['P','%','R'],
        '&': ['P','&','R'],
        '|': ['P','|','R'],
        '-': ['P','-','R'],
        '#': ['P','#','R'],
        '1': ['P','1','R'],
        'c': ['B','c','L']
      }
    };
  }

  // obtiene símbolo bajo el cabezal (si está fuera, se considera '_')
  getSymbol() {
    if (this.head < 0) return '_';
    if (this.head >= this.tape.length) return '_';
    return this.tape[this.head];
  }

  // escribe símbolo en la cinta (amplía la cinta según sea necesario)
  setSymbol(sym) {
    if (this.head < 0) {
      // añadimos blancos al inicio y ajustamos la cabeza
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
    // 'S' no mueve
  }

  addHistory() {
    // Siempre incluir el estado actual en la configuración
    const currentConfig = [...this.tape];
    currentConfig.splice(this.head, 0, this.state);
    const repr = currentConfig.join('');
    this.history.push(repr);
  }

  getTransition(state, symbol) {
    return this.transitions[state]?.[symbol];
  }

  step() {
    const sym = this.getSymbol();
    const trans = this.getTransition(this.state, sym);
    
    if (!trans) {
      if (this.debug) console.log(`STEP ${this.stepCount}: No transition for state=${this.state} symbol='${sym}'`);
      return false; // No hay transición disponible
    }

    const [newState, newSymbol, dir] = trans;

    if (this.debug) {
      // Snapshot around head for readability
      const left = Math.max(0, this.head - 10);
      const right = Math.min(this.tape.length, this.head + 10);
      const view = this.tape.slice(left, right).join('');
      console.log(`STEP ${this.stepCount}: state=${this.state} head=${this.head} sym='${sym}' -> (${newState}, '${newSymbol}', ${dir}) tapeView='${view}'`);
    }

    // Aplicar la transición
    this.setSymbol(newSymbol);
    this.state = newState;
    this.move(dir);
    this.addHistory();
    this.stepCount++;
    
    return true;
  }

  run() {
    let steps = 0;
    this.stepCount = 0;
    // Usamos la historia inicial ya añadida en el constructor.
    while (true) {
      // Ejecutar un paso
      if (!this.step()) {
        if (this.debug) console.log(`Detenido en estado ${this.state} con símbolo ${this.getSymbol()}`);
        break;
      }

      // Si alcanzamos el estado de aceptación, la última llamada a step()
      // ya habrá añadido la configuración con el estado H en history.
      if (this.state === 'H') {
        break;
      }

      steps++;
      if (steps > 5000) {
        console.log('Muchos pasos, posible bucle');
        this.history.push('... (posible bucle)');
        break;
      }
    }

    // Devolver solo la secuencia de configuraciones; el llamador puede
    // prefijar 'ID:' si lo desea.
    return this.history.join(' |- ');
  }
}

function generarID() {
  const entrada = document.getElementById('txtEntrada').value.trim();
  const salida = document.getElementById('lblResultado');

  // Validaciones
  if (!entrada.includes('-')) {
    salida.innerText = "Error: El input debe contener '-' separando los dos binarios.";
    return;
  }
  const parts = entrada.split('-');
  if (parts.length !== 2) {
    salida.innerText = "Error: Formato inválido. Debe ser A-B con A y B binarios.";
    return;
  }
  const [num1, num2] = parts;
  if (!/^[01]+$/.test(num1) || !/^[01]+$/.test(num2)) {
    salida.innerText = "Error: Solo dígitos 0 y 1 permitidos.";
    return;
  }
  if (num1.length !== num2.length) {
    salida.innerText = "Error: Ambos números deben tener la misma longitud.";
    return;
  }

  // Rechazar si el binario de la izquierda es menor que el de la derecha
  // (mismo largo => comparación lexicográfica bit a bit)
  for (let i = 0; i < num1.length; i++) {
    if (num1[i] === num2[i]) continue;
    if (num1[i] === '0' && num2[i] === '1') {
      salida.innerText = 'Cadena Rechazada';
      return;
    }
    // si num1[i] === '1' && num2[i] === '0', entonces num1 > num2 -> OK
    break;
  }

  // Leer modo de visualización
  const viewMode = (document.getElementById('viewMode') || {}).value || 'completa';
  const windowSize = viewMode === 'ventana' ? 3 : undefined;

  // Creamos la máquina pasando la cadena original (sin agregar '_' aquí)
  const tm = new TuringMachine(entrada, { maxSteps: 20000, mode: viewMode, windowSize });
  const id = tm.run();
  salida.innerText = 'ID: ' + id;
}

