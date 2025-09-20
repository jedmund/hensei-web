export type ToEditData<TModel, TEdit> = (model: TModel) => TEdit

export interface EditForm<TModel, TEdit> {
  init: (model: TModel) => TEdit
  reset: (model: TModel) => TEdit
}

export function createEditForm<TModel, TEdit>(toEditData: ToEditData<TModel, TEdit>): EditForm<TModel, TEdit> {
  return {
    init: (model: TModel) => toEditData(model),
    reset: (model: TModel) => toEditData(model),
  }
}

