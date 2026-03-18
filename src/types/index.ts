export interface Slide {
  id: string;
  order: number;
  text: string;
  background: string;
  presentationId: string;
}

export interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type PresentationSummary = {
  id: string;
  title: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count: { slides: number };
};

export interface SlideInput {
  id?: string; // undefined = new slide (will be inserted)
  text: string;
  background: string;
  order: number;
}
