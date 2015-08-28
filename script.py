import os, sys, argparse
import matplotlib.pyplot as plt
import library

ROOT = '/home/lili/Dropbox/plots/'
#ROOT = '/Users/lilidworkin/Desktop/'

def make_plots(args):
    print 'Group: %s' % args.group
    print 'Fill Defect: %s' % args.fill_defect
    group = int(args.group) if args.group else None
    pathA = 'both' if not args.group else args.group
    pathB = 'filled' if args.fill_defect else ''
    path = ROOT + '%s-%s' % (pathA, pathB)
    if not os.path.exists(path):
        os.mkdir(path)
    matrix_func = library.gen_matrix if not args.user_centric \
      else library.gen_matrix_user_centric
    matrix = matrix_func(group, args.fill_defect)
    plot_funcs = [library.each_round_vs_supergame,
                  library.ave_round_vs_supergame,
                  library.grouped_supergames_vs_round,
                  library.all_data]
    for func in plot_funcs:
        func(matrix, path + '/')
        plt.clf()
    

def player_games(args):
    workerId = library.find_workerId(args.user) if args.user else args.worker
    library.print_worker_games(workerId, args.batch)
    

def convert(args):
    print library.find_workerId(args.user)


if __name__ == '__main__':
    func_map = {'plots': lambda: make_plots(args),
                'player': lambda: player_games(args),
                'unfinished': lambda: library.print_unfinished_games(args.batch),
                'convert': lambda: convert(args)}
    parser = argparse.ArgumentParser()
    parser.add_argument('type', choices=func_map.keys())
    parser.add_argument('--batch', default=None)
    parser.add_argument('--group', default=None)
    parser.add_argument('-u', '--user')
    parser.add_argument('-w', '--worker')
    parser.add_argument('--fill-defect', dest='fill_defect', action='store_true')
    parser.add_argument('--user-centric', dest='user_centric', action='store_true')
    args = parser.parse_args()
    func_map[args.type]()
