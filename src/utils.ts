export function isDry() {
  const dry = process.env.DRY_RUN;
  return dry && dry !== "false";
}
