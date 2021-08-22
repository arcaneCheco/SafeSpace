import create from 'zustand';

type store = {
  activeUsers: any;
};

const useStore = create<store>((set) => ({
  activeUsers: {}
}));

// useStore.subscribe(() => {
//   console.log('new state', useStore.getState());
// })

export default useStore;