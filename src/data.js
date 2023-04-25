// import fetch from 'node-fetch';

export default async function getData() {
  // const url = 'https://...';
  // const data = await fetch(url).then(r => r.json());

  const data = {
    title: 'The Strange Case of Dr. Jekyll and Mr. Hyde',
    description:
      'Mr. Utterson the lawyer was a man of a rugged countenance that was never lighted by a smile.',
  };

  return data;
}
