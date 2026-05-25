/**
 * Reusable Icon component using Google Material Symbols.
 * Replaces all react-icons usage throughout the app.
 */
export default function Icon({ name, size, className = '', style = {}, ...props }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size || 'inherit',
        verticalAlign: 'middle',
        lineHeight: 1,
        ...style,
      }}
      {...props}
    >
      {name}
    </span>
  );
}
