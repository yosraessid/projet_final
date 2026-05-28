import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <section className="grid-one">
      <article className="card hero-card">
        <p className="badge">To-do liste collaborative</p>
        <h2>Organisez vos taches en equipe facilement.</h2>
        <p>
          Creez des listes, assignez des taches, suivez l avancement et recevez
          des notifications importantes, le tout dans une interface moderne.
        </p>
        <div className="row">
          <Link className="button button-primary" to="/auth">
            Commencer maintenant
          </Link>
          <Link className="button button-light" to="/dashboard">
            Ouvrir le dashboard
          </Link>
        </div>
      </article>

      <article className="card">
        <h3>Fonctionnalites principales</h3>
        <ul className="list">
          <li>Listes / projets de to-do</li>
          <li>Taches avec priorite, deadline et statut</li>
          <li>Attribution a un membre</li>
          <li>Notifications (assignation, deadline proche, tache terminee)</li>
          <li>Interface moderne et responsive</li>
        </ul>
      </article>
    </section>
  )
}

export default HomePage
