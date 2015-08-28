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
    matrix = library.genMatrix(group, args.fill_defect)
    library.plotRounds(matrix, path + '/')
    plt.clf()
    library.plotCoopPerRound(matrix, path + '/')
    plt.clf()
    library.plotEachRound(matrix, path + '/')
    

def player_games(args):
    workerId = library.findWorkerId(args.user) if args.user else args.worker
    library.printWorkerGames(workerId, args.batch)
    

def convert(args):
    print library.findWorkerId(args.user)


if __name__ == '__main__':
    func_map = {'plots': lambda: make_plots(args),
                'player': lambda: player_games(args),
                'unfinished': lambda: library.printUnfinishedGames(args.batch),
                'convert': lambda: convert(args)}
    parser = argparse.ArgumentParser()
    parser.add_argument('type', choices=func_map.keys())
    parser.add_argument('--batch', default=None)
    parser.add_argument('--group', default=None)
    parser.add_argument('-u', '--user')
    parser.add_argument('-w', '--worker')
    parser.add_argument('--fill-defect', dest='fill_defect', action='store_true')
    args = parser.parse_args()
    func_map[args.type]()
