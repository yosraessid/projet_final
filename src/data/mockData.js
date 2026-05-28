export const dashboardStats = [
  { label: 'Taches totales', value: 42 },
  { label: 'Taches terminees', value: 26 },
  { label: 'Membres actifs', value: 8 },
  { label: 'Projets en cours', value: 3 },
]

export const tasks = [
  {
    id: 1,
    title: 'Finaliser la maquette accueil',
    priority: 'Haute',
    deadline: '2026-06-02',
    status: 'En cours',
    assignee: 'Yosra',
  },
  {
    id: 2,
    title: 'Creer la page groupes',
    priority: 'Moyenne',
    deadline: '2026-06-05',
    status: 'A faire',
    assignee: 'Rayen',
  },
  {
    id: 3,
    title: 'Tester la notification email',
    priority: 'Basse',
    deadline: '2026-06-09',
    status: 'Terminee',
    assignee: 'Sarra',
  },
]

export const groups = [
  { id: 1, name: 'Equipe Frontend', members: 4, progress: 70 },
  { id: 2, name: 'Equipe Backend', members: 3, progress: 55 },
  { id: 3, name: 'Equipe Design', members: 2, progress: 82 },
]
