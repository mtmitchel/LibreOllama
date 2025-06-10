import 'fabric';

declare module 'fabric' {
  namespace fabric {
    interface IObjectOptions {
      customId?: string;
    }

    interface ITextOptions {
      customId?: string;
    }

    interface Object {
      customId?: string;
    }

    interface IText {
      customId?: string;
    }
  }
}
