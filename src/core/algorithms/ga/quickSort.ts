// QuickSort algorithm implementation to sort based on fitness values
const quickSort = (
  source: [string, number][], // The array of [Chromosome, FitnessValue] pairs to be sorted
  left: number = 0, // The starting index of the segment to be sorted
  right: number = source.length - 1 // The ending index of the segment to be sorted
) => {
  let index;

  // Only sort if the array has more than one element
  if (source.length > 1) {
    // Partition the array and get the pivot index
    index = partition(source, left, right);

    // Recursively apply quicksort to the left partition
    if (left < index - 1) quickSort(source, left, index - 1);

    // Recursively apply quicksort to the right partition
    if (index < right) quickSort(source, index, right);
  }

  // Return the sorted array
  return source;
};

// Helper function to choose a pivot for the quicksort
const choosePivot = (
  source: [string, number][],
  left: number,
  right: number
): number => {
  // Calculate the middle index
  const mid = Math.floor((left + right) / 2);

  // Extract the fitness values at the left, middle, and right indices
  const [l, m, r] = [source[left][1], source[mid][1], source[right][1]];

  // Determine and return the index of the median of the three fitness values
  if (l < m) {
    if (m < r) return mid;
    return l < r ? right : left;
  }
  if (m < r) return l < r ? left : right;
  return mid;
};

// Helper function to partition the array around a pivot
const partition = (
  source: [string, number][], // The array of [Chromosome, FitnessValue] pairs to be partitioned
  left: number = 0, // The starting index of the segment to be partitioned
  right: number = source.length - 1 // The ending index of the segment to be partitioned
) => {
  // Choose a pivot index and get the pivot fitness value
  const pivotIndex = choosePivot(source, left, right);
  const pivot = source[pivotIndex][1];

  // Partition the array into elements less than and greater than the pivot fitness value
  while (left <= right) {
    // Increment left index until a fitness value greater than or equal to the pivot is found
    while (source[left][1] < pivot) left++;

    // Decrement right index until a fitness value less than or equal to the pivot is found
    while (source[right][1] > pivot) right--;

    // Swap elements if left index is less than or equal to right index
    if (left <= right) {
      [source[left], source[right]] = [source[right], source[left]];
      left++;
      right--;
    }
  }

  // Return the left index, which is the partition point
  return left;
};

export default quickSort;
