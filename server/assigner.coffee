class TurkServer.Assigners.PairAssigner extends TurkServer.Assigner
  userJoined: (asst) ->
      treatment = []
      lobbyAssts = @lobby.getAssignments()
      if lobbyAssts.length is 2
          @instance = @batch.createInstance(@batch.getTreatments())
          @instance.setup()
          for asst in lobbyAssts
              @lobby.pluckUsers([asst.userId])
              @instance.addAssignment(asst)
              Assignments.update asst._id,
                $set: {game: 1}                
