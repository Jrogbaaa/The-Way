import { Metadata } from 'next';
import PhotoEditorContainer from '../../components/PhotoEditorContainer';

export const metadata: Metadata = {
  title: 'Photo Editor - THE WAY',
  description: 'Edit your photos using AI and enhance them with just a few clicks',
};

export default function PhotoEditorPage() {
  return <PhotoEditorContainer />;
} 