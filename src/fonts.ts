// Import the font file
import angryFont from './assets/fonts/angry.otf';

// Create and add the font to the document
export const loadAngryFont = () => {
  const font = new FontFace('Angry', `url(${angryFont})`, {
    weight: '400',
    style: 'normal',
    display: 'swap'
  });

  font.load().then((loadedFont) => {
    document.fonts.add(loadedFont);
    console.log('Angry font loaded successfully');
  }).catch((error) => {
    console.error('Failed to load Angry font:', error);
  });
};
