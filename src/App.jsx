import { useMemo, useState } from 'react'
import './App.css'

function App() {
  // Nom affiché en haut de la page.
  const [projectName] = useState('Mon Projet Final')
  // Valeur en cours dans le champ texte.
  const [taskInput, setTaskInput] = useState('')
  // Liste initiale des tâches.
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Créer la page d accueil', done: true },
    { id: 2, title: 'Ajouter les sections principales', done: false },
    { id: 3, title: 'Préparer la présentation finale', done: false },
  ])

  // Compte le nombre de tâches terminées.
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.done).length,
    [tasks],
  )

  const totalTasks = tasks.length

  // Ajoute une nouvelle tâche quand on soumet le formulaire.
  const addTask = (event) => {
    event.preventDefault()
    const cleanValue = taskInput.trim()
    if (!cleanValue) return

    setTasks((previousTasks) => [
      ...previousTasks,
      { id: Date.now(), title: cleanValue, done: false },
    ])
    setTaskInput('')
  }

  // Bascule une tâche en fait / pas fait.
  const toggleTask = (taskId) => {
    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      ),
    )
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>{projectName}</h1>
        <p>Base React simple et professionnelle</p>
      </header>

      <section className="card">
        <h2>Avancement</h2>
        <p>
          Taches terminees : <strong>{completedTasks}</strong> / {totalTasks}
        </p>
      </section>

      <section className="card">
        <h2>Ajouter une tache</h2>
        <form className="task-form" onSubmit={addTask}>
          <input
            type="text"
            placeholder="Exemple: Faire la page contact"
            value={taskInput}
            onChange={(event) => setTaskInput(event.target.value)}
          />
          <button type="submit">Ajouter</button>
        </form>
      </section>

      <section className="card">
        <h2>Liste des taches</h2>
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <label>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                />
                <span className={task.done ? 'done' : ''}>{task.title}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default App
