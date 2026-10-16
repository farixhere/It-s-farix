/* ============================================================
   FARIX — EDITABLE CONTENT
   Everything you see on the site that is "words" lives here.
   Edit this file, refresh the page, done. No build step.

   Anything marked  placeholder: true  (or labelled "Placeholder")
   is sample content. Replace it with your real work.
   Leave a link empty ('') and its button is shown as "not added yet".
   ============================================================ */
window.FARIX_CONTENT = {
  name: 'Farix',
  year: '2026',
  location: 'Earth, for now',

  /* Hero. Two lines. Alternative: ['Beyond the', 'Ordinary.'] */
  title: ['Still', 'Becoming.'],
  kicker: 'The digital universe',
  lede: 'Exploring ideas, building digital experiences, and creating my own little universe.',

  about: {
    lead: "I'm Farix. I'm curious about people, ideas, technology, and the ways digital experiences can make us feel something.",
    note: 'Editable copy. Replace with your own story.',
    signals: [
      { label: 'People',     text: 'What makes someone stop, look twice, and care.' },
      { label: 'Ideas',      text: 'Following a thought until it turns into something you can open.' },
      { label: 'Technology', text: 'A material to shape, not a thing to just use.' },
      { label: 'Feeling',    text: 'The goal of every screen: make someone feel something.' }
    ]
  },

  /* Project Orbit. Replace the sample projects with real ones.
     colors = [highlight, body, shadow] of the planet cover.        */
  projects: [
    {
      id: 'alpha',
      placeholder: true,
      title: 'Sample Project Alpha',
      category: 'Placeholder · Web experience',
      blurb: 'A stand-in for your first project. Replace this text with one honest sentence about it.',
      details: 'This is a clearly labelled placeholder. Describe the idea, what you built, what you learned, and what you would do next. Keep it personal and specific.',
      tags: ['Placeholder', 'Interactive', 'Concept'],
      link: '',
      colors: ['#ffffff', '#70EEFF', '#0b3a6b']
    },
    {
      id: 'beta',
      placeholder: true,
      title: 'Sample Project Beta',
      category: 'Placeholder · Visual design',
      blurb: 'A stand-in for a design or art piece. Swap in a real title, a real cover and a real link.',
      details: 'Placeholder detail view. Use this space for the story behind the work: the problem, the process, the result. Add a live link in js/content.js and a button appears.',
      tags: ['Placeholder', 'Design', 'Motion'],
      link: '',
      colors: ['#fdf3ff', '#D94DFF', '#3a0f6b']
    },
    {
      id: 'gamma',
      placeholder: true,
      title: 'Sample Project Gamma',
      category: 'Placeholder · Experiment',
      blurb: 'A stand-in for something you built just to see if it would work.',
      details: 'Placeholder detail view. Side projects and experiments are often the most memorable part of a portfolio. Tell people why you made it.',
      tags: ['Placeholder', 'Code', 'Prototype'],
      link: '',
      colors: ['#eef6ff', '#428DFF', '#0a1c5a']
    },
    {
      id: 'delta',
      placeholder: true,
      title: 'Sample Project Delta',
      category: 'Placeholder · Tool',
      blurb: 'A stand-in for a small tool, app, or utility. One line on who it helps.',
      details: 'Placeholder detail view. Explain what the tool does, who it is for, and what makes it yours.',
      tags: ['Placeholder', 'Product', 'Build'],
      link: '',
      colors: ['#f6f0ff', '#7C4DFF', '#1d0a52']
    }
  ],

  /* Experiment Lab. Each one is a small live toy (see js/experiments.js). */
  experiments: [
    {
      id: 'orbits',
      title: 'Planetary System',
      purpose: 'A study of orbital motion. Each body keeps its own speed and distance.',
      hint: 'Tap or click to launch a new body.'
    },
    {
      id: 'field',
      title: 'Particle Field',
      purpose: 'A field of dust that reacts to attention. It scatters from your pointer and settles back.',
      hint: 'Move or drag across the field.'
    },
    {
      id: 'lit',
      title: 'Lit Object',
      purpose: 'How light direction and material change what an object feels like.',
      hint: 'Move over the sphere, or press the button to change material.'
    },
    {
      id: 'type',
      title: 'Typographic Gravity',
      purpose: 'Letterforms that lean toward whatever you are pointing at.',
      hint: 'Move across the word.'
    },
    {
      id: 'cosmos',
      title: 'Miniature Cosmos',
      purpose: 'Three layers of stars moving at different speeds to fake depth.',
      hint: 'Drag to look around.'
    }
  ],

  /* Focus areas. What Farix is exploring. These are directions, not job titles. */
  skills: [
    { name: 'Interactive web',     text: 'Sites that respond, move, and feel alive.' },
    { name: 'Visual design',       text: 'Layout, type, colour, and mood.' },
    { name: 'Motion',              text: 'Timing that makes an interface feel considered.' },
    { name: 'Creative coding',     text: 'Code as a way to draw, simulate, and play.' },
    { name: '3D & space visuals',  text: 'Light, depth, and scale on a flat screen.' },
    { name: 'UI / UX',             text: 'Making complicated things feel simple.' }
  ],

  /* Contact. Leave '' to show the button as "not added yet". */
  contact: {
    heading: ['Every universe', 'starts somewhere.'],
    text: 'Got an idea, a question, or just want to say hi? Send a transmission.',
    email: '',
    github: 'https://github.com/farixhere',
    linkedin: ''
  }
};
