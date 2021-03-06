import { escape } from 'he'
import { registerDecorator, ValidationOptions } from 'class-validator'

export function OnlyPlainText(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string): void {
    registerDecorator({
      name: 'OnlyPlainText',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validate(value: any) {
          return typeof value === 'string' && value === escape(value)
        },
      },
    })
  }
}
