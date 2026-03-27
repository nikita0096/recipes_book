export const toCamelCase = (obj: Record<string, any>) => {
  const newObj: Record<string, any> = {};

  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    newObj[camelKey] = obj[key];
  }

  return newObj;
};