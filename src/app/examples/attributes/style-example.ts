import { div } from 'rxfm';

export const styleExample = div(
  {
    style: {
      color: 'white',
      backgroundColor: 'black',
      padding: '10px',
      borderRadius: '5px',
    },
  },
  'Some stylish text.'
);
