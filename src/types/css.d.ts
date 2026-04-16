// src/types/css.d.ts
declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

// Also handle other assets if needed
declare module '*.scss' {
  const content: { [className: string]: string }
  export default content
}

declare module '*.sass' {
  const content: { [className: string]: string }
  export default content
}