import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Collapse,
  createFilterOptions,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  ListItem,
  Portal,
  Snackbar,
  SxProps,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { red } from "@mui/material/colors";
import { useEffect, useState } from "react";
import IModQueueEntry, {
  QueueEntryResult,
  QueueEntryStatus,
} from "../../models/IModeQueueEntry";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import config from "../../config";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import GppBadIcon from "@mui/icons-material/GppBad";
import GppGoodIcon from "@mui/icons-material/GppGood";
import {
  useAddModMessageMutation,
  useRefreshModMessageMutation,
  useUpdateModqueueMutation,
} from "../../redux/api/ModQueueAPI";
import GavelIcon from "@mui/icons-material/Gavel";
import AddCommentIcon from "@mui/icons-material/AddComment";
import LockIcon from "@mui/icons-material/Lock";
import Spotlight from "../Spotlight";
import ReactMarkdown from "react-markdown";
import RefreshIcon from "@mui/icons-material/Refresh";
import { extractInstanceFromActorId, getActorId } from "../../util/utils";
import { useLazyGetModLogsQuery } from "../../redux/api/ModLogApi";
import ExpandMore from "../ExpandMore";
import { PostView } from "lemmy-js-client";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  addMarkedUser,
  removeMarkedUser,
  selectMarkedUsers,
} from "../../redux/reducers/SettingsReducer";
import LinkIcon from "@mui/icons-material/Link";
import { useLocation } from "react-router-dom";
import { Chart } from "../CreatorChart/Chart";
const filter = createFilterOptions<{
  label?: string;
  value: string;
}>();

export const PostEntry = (props: {
  data: IModQueueEntry<PostView>;
  sx?: SxProps;
  onAction: (id: string) => void;
}) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [result, setResult] = useState<QueueEntryResult | undefined>();
  const [refresh, { isLoading }] = useRefreshModMessageMutation();
  const [initiateModLogs, modLogsData] = useLazyGetModLogsQuery();
  const [reason, setReason] = useState<string>("");
  const [modNote, setModNote] = useState<string>("");
  const [modNoteModalOpen, setModNoteModalOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const handleModalClickOpen = () => {
    setModalOpen(true);
  };
  const [hidePicture, setHidePicture] = useState<boolean>(false)
  const markedUsers = useAppSelector(selectMarkedUsers);
  const [updateReport] = useUpdateModqueueMutation();
  const [addModNote] = useAddModMessageMutation();
  const [open, setOpen] = useState(false);

  const handleModalClose = (cancel: boolean) => {
    if (!cancel) {
      updateReport({
        id: props.data.id,
        result: result,
        reason: reason,
      })
        .unwrap()
        .then(() => {
          props.onAction(props.data.id);
        });
      setResult(undefined);
    }
    setModalOpen(false);
  };

  const [expanded, setExpanded] = useState(false);
  const completed = props.data.status === QueueEntryStatus.Completed;
  const deleted = props.data.entry.post.deleted || false;
  const removed = props.data.entry.post.removed || false;
  const [postExpanded, setPostExpanded] = useState(
    !completed && !deleted && !removed
  );

  useEffect(() => {
    setPostExpanded(props.data.status === QueueEntryStatus.Pending);
  }, [props.data.status]);

  const handleUpdateClick = (res?: QueueEntryResult) => {
    setResult(res);
    handleModalClickOpen();
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  const handlePostExpandClick = () => {
    setPostExpanded(!postExpanded);
  };

  useEffect(() => {
    if (expanded && !modLogsData.data) {
      initiateModLogs({
        userId: props.data.entry.creator.id,
        communityId: props.data.entry.community.id,
      });
    }
  }, [expanded, modLogsData]);

  const [hoverAvatar, setHoverAvatar] = useState(false);

  const extraSX = markedUsers?.includes(props.data.entry.creator.id)
    ? { border: "2px solid red" }
    : {};

  return (
    <Card sx={{ ...props.sx, ...extraSX }}>
      <CardHeader
        avatar={
          <Box
            onMouseEnter={() => setHoverAvatar(true)}
            onMouseLeave={() => setHoverAvatar(false)}
            onClick={() =>
              markedUsers?.includes(props.data.entry.creator.id)
                ? dispatch(removeMarkedUser(props.data.entry.creator.id))
                : dispatch(addMarkedUser(props.data.entry.creator.id))
            }
          >
            <Avatar
              sx={{ bgcolor: red[500] }}
              aria-label="profile-avatar"
              src={!hoverAvatar ? props.data.entry.creator.avatar : undefined}
            >
              <Box
                sx={{
                  mr: "auto",
                  position: "absolute",
                  zIndex: 999,
                }}
              >
                +
              </Box>
            </Avatar>
          </Box>
        }
        action={
          <Box>
            <IconButton
              onClick={async (ev) => {
                ev.stopPropagation();
                const text = window.location.href + "modqueue/" + props.data.id;

                if ("clipboard" in navigator) {
                  await navigator.clipboard.writeText(text);
                } else {
                  document.execCommand("copy", true, text);
                }
                setOpen(true);
              }}
            >
              <LinkIcon />
            </IconButton>
            <IconButton
              disabled={isLoading}
              onClick={() => {
                refresh(props.data.id)
                  .unwrap()
                  .then(() => {
                    props.onAction(props.data.id);
                  });
              }}
            >
              <RefreshIcon />
            </IconButton>
            <ExpandMore
              expand={postExpanded}
              onClick={handlePostExpandClick}
              aria-expanded={postExpanded}
              aria-label="show more"
            >
              <ExpandMoreIcon />
            </ExpandMore>
          </Box>
        }
        title={
          <Box
            sx={{
              display: "flex",
              maxWidth: "75%",
            }}
          >
            <Typography
              sx={{
                mr: "15px",
                textDecoration: deleted || removed ? "line-through" : "none",
                textDecorationColor: "red",
                textDecorationThickness: "5px",
                cursor: "pointer",
              }}
              onClick={() => {
                window.open(
                  `${config.instance}post/${props.data.entry.post.id}`,
                  "_blank"
                );
              }}
              variant="h4"
            >
              {props.data.entry.post.name}
            </Typography>
            {props.data.entry.post.locked ? (
              <LockIcon sx={{ color: "red", alignSelf: "center" }} />
            ) : (
              <></>
            )}
            {props.data.result ? (
              props.data.result === QueueEntryResult.Approved ? (
                <GppGoodIcon sx={{ color: "green", alignSelf: "center" }} />
              ) : (
                <GppBadIcon sx={{ color: "red", alignSelf: "center" }} />
              )
            ) : (
              <></>
            )}
          </Box>
        }
        subheader={
          <Box
            sx={{
              display: "inline-flex",
              flexDirection: "row",
            }}
          >
            <Typography
              onClick={() => {
                window.open(
                  `${config.instance}u/${
                    props.data.entry.creator.local
                      ? props.data.entry.creator.name
                      : getActorId(
                          extractInstanceFromActorId(
                            props.data.entry.creator.actor_id
                          ),
                          props.data.entry.creator.name
                        )
                  }`,
                  "_blank"
                );
              }}
              sx={{
                cursor: "pointer",
              }}
              variant="body1"
            >
              {props.data.entry.creator.local
                ? props.data.entry.creator.name
                : getActorId(
                    extractInstanceFromActorId(
                      props.data.entry.creator.actor_id
                    ),
                    props.data.entry.creator.name
                  )}
            </Typography>
            <Typography
              sx={{
                cursor: "pointer",
                ml: "5px",
                alignSelf: "center",
              }}
              onClick={() => {
                window.open(
                  `${config.instance}c/${
                    props.data.entry.community.local
                      ? props.data.entry.community.name
                      : getActorId(
                          extractInstanceFromActorId(
                            props.data.entry.community.actor_id
                          ),
                          props.data.entry.community.name
                        )
                  }`,
                  "_blank"
                );
              }}
              variant="body2"
            >
              posted in{" "}
              <b>
                {props.data.entry.community.local
                  ? props.data.entry.community.name
                  : getActorId(
                      extractInstanceFromActorId(
                        props.data.entry.community.actor_id
                      ),
                      props.data.entry.community.name
                    )}
              </b>
            </Typography>
          </Box>
        }
      />
      <Collapse in={postExpanded} timeout="auto" unmountOnExit>
        {(props.data.entry.post.thumbnail_url || props.data.entry.post.url) && !hidePicture? (
          <Box
            sx={{
              position: "relative",
            }}
          >
            <Spotlight>
              <CardMedia
                component="img"
                image={props.data.entry.post.thumbnail_url || props.data.entry.post.url}
                onError={(e) => {
                  console.error(e)
                  setHidePicture(true)
                }}
                alt="Thumbnail Url"
              />
            </Spotlight>
          </Box>
        ) : (
          <></>
        )}
        <Box sx={{ pl: "25px", pt: "10px" }}>
          {props.data.entry.post.thumbnail_url || props.data.entry.post.url ? (
            <>
              <Button
                sx={{ mb: 1 }}
                onClick={() => {
                  window.open(
                    props.data.entry.post.thumbnail_url || props.data.entry.post.url,
                    "_blank"
                  );
                }}
              >
                URL: {props.data.entry.post.thumbnail_url || props.data.entry.post.url}
              </Button>
              <Divider />
            </>
          ) : (
            <></>
          )}
          {props.data.entry.post.body ? (
            <Box>
              <ReactMarkdown children={props.data.entry.post.body} />
            </Box>
          ) : (
            <></>
          )}

          {props.data.modNote ? (
            <Box>
              <Typography
                variant="body2"
                pt={"5px"}
                mt={2}
                color="text.primary"
              >
                Mod Notes:
              </Typography>
              {props.data.modNote.map((note) => (
                <Box key={note.note + note.person.person.id + Math.random()}>
                  <Divider />
                  <Box
                    sx={{
                      cursor: "default",
                      display: "flex",
                      mt: "10px",
                      mb: "5px",
                      wordBreak: "break-word",
                    }}
                  >
                    <Avatar src={note.person.person.avatar} />
                    <Typography
                      sx={{ pl: "10px" }}
                    >{`${note.person.person.name}: ${note.note}`}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <></>
          )}
        </Box>
        <CardActions disableSpacing>
          <Tooltip title="Approve the post">
            <span>
              <IconButton
                disabled={completed}
                onClick={() => {
                  handleUpdateClick(QueueEntryResult.Approved);
                }}
              >
                <GppGoodIcon
                  sx={{
                    color: !completed ? "green" : "white",
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Remove the post">
            <span>
              <IconButton
                disabled={completed}
                onClick={() => {
                  handleUpdateClick(QueueEntryResult.Removed);
                }}
              >
                <GppBadIcon
                  sx={{
                    color: !completed ? "red" : "white",
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Lock the post">
            <span>
              <IconButton
                disabled={completed}
                onClick={() => {
                  handleUpdateClick(QueueEntryResult.Locked);
                }}
              >
                <LockIcon
                  sx={{
                    color: !completed ? "red" : "white",
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Bann the post creator">
            <span>
              <IconButton
                disabled={completed}
                onClick={() => {
                  handleUpdateClick(QueueEntryResult.Banned);
                }}
              >
                <GavelIcon
                  sx={{
                    color: !completed ? "red" : "white",
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Restore the Mod Queue Entry">
            <span>
              <IconButton
                disabled={!completed}
                onClick={() => {
                  handleUpdateClick();
                }}
              >
                <RotateLeftIcon
                  sx={{
                    color: !completed ? "white" : "red",
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Add a Mod Note!">
            <span>
              <IconButton
                onClick={() => {
                  setModNoteModalOpen(true);
                }}
                sx={{
                  marginLeft: "auto",
                }}
              >
                <AddCommentIcon />
              </IconButton>
            </span>
          </Tooltip>
          <ExpandMore
            expand={expanded}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show comments"
          >
            <ExpandMoreIcon />
          </ExpandMore>
        </CardActions>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>
            {modLogsData.data && !modLogsData.isFetching ? (
              <Box>
                <Box>
                  <Typography variant="h6">
                    Mod Logs from this community
                  </Typography>
                </Box>
                <Divider />
                {modLogsData.data.success ? (
                  Object.entries(modLogsData.data.modLog!.entries)
                    .filter((x) => x[1].length > 0)
                    .map((entry) => (
                      <Box
                        key={entry[0] + Math.random()}
                        sx={{ display: "flex" }}
                      >
                        <Typography variant="body2" mt={2} color="text.primary">
                          {entry[0]}:
                        </Typography>
                        <Typography
                          variant="body2"
                          mt={2}
                          ml={1}
                          color="text.primary"
                        >
                          {entry[1].length}
                        </Typography>
                      </Box>
                    ))
                ) : (
                  <>Something went wrong</>
                )}
              </Box>
            ) : (
              <>Loading...</>
            )}
            <Box
              sx={{
                height: "500px",
                width: "100%",
                backgroundColor: "grey",
              }}
            >
              <Chart data={{ person: props.data.entry.creator }} />
              {/* <D3Chart person={props.data.entry.creator} /> */}
            </Box>
          </CardContent>
        </Collapse>
      </Collapse>
      <Dialog open={modalOpen} onClose={() => handleModalClose(true)} fullWidth>
        <DialogTitle>Reason</DialogTitle>
        <DialogContent>
          <Autocomplete
            autoFocus
            id="reason"
            options={config.reasons.filter((x) => !x.type || x.type === "Post")}
            fullWidth
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            sx={{ pt: 1 }}
            renderInput={(params) => (
              <TextField {...params} label="The Reason:" />
            )}
            renderOption={(props, option) => (
              <ListItem {...props} key={option.label + option.value}>
                {option.label ?? option.value}
              </ListItem>
            )}
            onChange={(e, newValue) => {
              if (typeof newValue === "string") {
                setReason(newValue);
              } else if (newValue && newValue.value) {
                // Create a new value from the user input
                setReason(newValue.value);
              } else {
                setReason("");
              }
            }}
            filterOptions={(options, params) => {
              const filtered = filter(options, params);

              const { inputValue } = params;
              // Suggest the creation of a new value
              const filteredData = filtered.filter((option) =>
                option.value.toLowerCase().includes(inputValue.toLowerCase())
              );
              const isExisting = filteredData.some(
                (option) => inputValue === option.value
              );
              if (inputValue !== "" && !isExisting) {
                filteredData.push({
                  label: `Use "${inputValue}"`,
                  value: `${inputValue}`,
                });
              }
              return filteredData;
            }}
            getOptionLabel={(option) => {
              return option.label ?? option.value;
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleModalClose(true)}>Cancel</Button>
          <Button onClick={() => handleModalClose(false)}>Submit</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={modNoteModalOpen}
        onClose={() => setModNoteModalOpen(false)}
        fullWidth
      >
        <DialogTitle>Your Comment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="comment"
            label="Comment"
            fullWidth
            variant="standard"
            onChange={(e) => {
              setModNote(e.target.value);
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setModNote("");
              setModNoteModalOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              addModNote({
                modNote: modNote,
                id: props.data.id,
              })
                .unwrap()
                .then(() => {
                  props.onAction(props.data.id);
                });
              setModNote("");
              setModNoteModalOpen(false);
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
      <Portal>
        <Snackbar
          open={open}
          autoHideDuration={6000}
          onClose={() => setOpen(false)}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <Alert
            onClose={() => setOpen(false)}
            severity="success"
            sx={{ width: "100%" }}
          >
            Copied the URL to the clipboard!
          </Alert>
        </Snackbar>
      </Portal>
    </Card>
  );
};
