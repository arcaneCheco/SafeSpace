import create from 'zustand';

type store = {
  activeUsers: any;
  userSpecificId: string;
  userConnectionGradients: any;
};

const useStore = create<store>((set) => ({
  activeUsers: {},
  userSpecificId: '',
  userConnectionGradients: {}
}));

// useStore.subscribe(() => {
//   console.log('new state', useStore.getState());
// })

export default useStore;