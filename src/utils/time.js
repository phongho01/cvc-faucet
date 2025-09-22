const diffTime = (start, end) => {
  let diff = end - start;
  let hours = Math.floor(diff / 1000 / 60 / 60);
  diff -= hours * 1000 * 60 * 60;
  let minutes = Math.floor(diff / 1000 / 60);

  // If using time pickers with 24 hours format, add the below line get exact hours
  if (hours < 0) hours = hours + 24;

  return (hours <= 9 ? '0' : '') + hours + (hours === 1 ? ' hour ' : ' hours ') + (minutes <= 9 ? '0' : '') + minutes + (minutes === 1 ? ' minute' : ' minutes');
}

module.exports = {
    diffTime
}