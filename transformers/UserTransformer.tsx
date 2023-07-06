// Transforms API response to User object
export function toObject(data: any): User {
  return {
    id: data.id,
    username: data.username,
    avatar: {
      picture: data.avatar.picture,
      element: data.avatar.element,
    },
    gender: data.gender,
    language: data.language,
    theme: data.theme,
  } as User
}

// Transforms User object into API parameters
export function toParams(data: User): UserParams {
  return {
    username: data.username,
    picture: data.avatar.picture,
    element: data.avatar.element,
    language: data.language,
    gender: data.gender,
    theme: data.theme,
  }
}
