import create from "zustand";

type store = {
  // activeUsers: any;
  // userSpecificId: string;
  // userConnectionGradients: any;
  // distances: any;
  conn: any;
};

const useStore = create<store>((set) => ({
  // activeUsers: {},
  // userSpecificId: '',
  // userConnectionGradients: {},
  // distances: {},
  conn: [],
}));

// useStore.subscribe(() => {
//   console.log('new state', useStore.getState());
// })

export default useStore;
