// import fetch from 'node-fetch';

export default async function getData() {
  // const url = 'https://...';
  // const data = await fetch(url).then(r => r.json());
  const datum = [
    {
      title: "Thinking Out Loud. Ed Sheeran",
      album: "",
      audiosrc:
        "https://www.wsj.com/media/ed-3.mp3",
      spectogram:
        "https://s.wsj.net/public/resources/images/wave-ed3.png",
      audioimg:
        "https://s.wsj.net/public/resources/images/art-ed-2.jpg",
      offset: 0,  
      spotify: "",
    },
    {
      title: "Let's Get It On. Marvin Gaye",
      album: "",
      audiosrc:
        "https://www.wsj.com/media/marvin-3.mp3",
      spectogram:
        "https://s.wsj.net/public/resources/images/wave-marvin3.png",
      audioimg:
        "https://s.wsj.net/public/resources/images/art-marvin-2.jpg",
      offset: 0,    
      spotify: "",
    },
  ];
  const data = {
    data: datum
  };

  return data;
}
