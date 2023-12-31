import {
  Alert,
  AlertColor,
  Box,
  Button,
  Collapse,
  FormControlLabel,
  Portal,
  Snackbar,
  Switch,
} from "@mui/material";
import { useLazyFetchCommunitiesQuery } from "../redux/api/ModQueueAPI";
import { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  selectSpotlight,
  setSpotlight,
} from "../redux/reducers/SettingsReducer";
import { useWindowSize } from "../util/utils";
import { Community } from "lemmy-js-client";
import { logoutUser } from "../redux/reducers/AuthenticationReducer";
import { useParams } from "react-router-dom";
import {
  useGetAdminLogEntryQuery,
  useLazyGetAdminLogQuery,
} from "../redux/api/AdminLogsAPI";
import AdminLogModel, { adminAllowedEntries } from "../models/adminLogModel";
import { AdminLogEntry } from "../components/entries/AdminLogEntry";

export const AdminLogs = () => {
  const dispatch = useAppDispatch();
  const [fetchMore, { data: adminLogData, isFetching, isLoading, isError }] =
    useLazyGetAdminLogQuery();

  const params = useParams();
  const isSingleView = "id" in params;
  const [wasSingleView, setWasSingleView] = useState<boolean>(isSingleView);
  const {
    data: SingleViewData,
    refetch,
    isError: singleError,
  } = useGetAdminLogEntryQuery(params.id!, { skip: !isSingleView });
  const [alert, setAlert] = useState<
    { state: AlertColor; text: string } | undefined
  >(undefined);
  const [fetchCommunities, { data: communityData, isError: manyError }] =
    useLazyFetchCommunitiesQuery({ pollingInterval: 2 * 60 * 1000 });

  const [adminLogs, setAdminLogs] = useState<
    AdminLogModel<adminAllowedEntries>[]
  >([]);
  const spotlight = useAppSelector(selectSpotlight);
  const [showOnlyOpenTasks, setShowOnlyOpenTasks] = useState<boolean>(
    localStorage.getItem("showOnlyOpenTasks") === "true"
  );

  const hasError = useCallback(() => {
    return isError || singleError || manyError;
  }, [isError, singleError, manyError]);

  const [oldH, setOldH] = useState<number>(0);
  const [adminData, setAdminData] = useState<
    AdminLogModel<adminAllowedEntries>[]
  >([]);
  let nextScroll = Date.now() + 5000;
  const handleScroll = (e: any) => {
    const bottom =
      e.target.scrollHeight - e.target.scrollTop <=
      e.target.clientHeight + 1500;

    if (
      bottom &&
      adminLogs &&
      !isFetching &&
      !isLoading &&
      adminLogs.length > 0 &&
      nextScroll <= Date.now() &&
      oldH !== e.target.scrollHeight &&
      hasMore()
    ) {
      setOldH(e.target.scrollHeight);
      nextScroll = Date.now() + 5000;
      fetchMore({
        id: adminLogs[adminLogs.length - 1].id,
        communities: filter.map((x) => x.community.id),
      });
    }
  };

  const [filterOpen, setFilterOpen] = useState<boolean>(false);
  const [filter, setFilter] = useState<{ community: Community }[]>([]);
  const [availableCommunities, setAvailableCommunities] = useState<Community[]>(
    []
  );
  const hasMore = useCallback(() => {
    return adminLogData?.length === 20 && !isSingleView;
  }, [adminLogData]);

  useEffect(() => {
    if (isFetching && isLoading) return;
    let data = adminLogs;

    data = data.filter((x) => {
      return (
        isSingleView ||
        filter.length === 0 ||
        filter.some((c) => c.community.id === x.entry.community.id)
      );
    });

    setAdminData(data);
  }, [
    adminLogs,
    showOnlyOpenTasks,
    filter,
    isFetching,
    isLoading,
    isSingleView,
  ]);

  useEffect(() => {
    if (filterOpen) fetchCommunities();
  }, [fetchCommunities, filterOpen]);

  useEffect(() => {
    if (communityData) setAvailableCommunities(communityData.communities);
  }, [communityData]);

  const [width] = useWindowSize();

  const handleShowOnlyOpenTasks = (checked: boolean) => {
    setShowOnlyOpenTasks(checked);
    localStorage.setItem("showOnlyOpenTasks", String(checked));
  };

  const onAction = (id: string) => {
    if (isSingleView) return refetch();
    fetchMore({
      id: id,
      communities: filter.map((x) => x.community.id),
      ammount: 1,
    });
  };

  const [props, setProps] = useState<any>({});

  useEffect(() => {
    if (width < 800) {
      setProps({ width: "100%", ml: "0" });
    } else if (width < 1200) {
      setProps({ width: "75%", ml: 75 / 2 + "%" });
    } else {
      setProps({ width: "50%", ml: "50%" });
    }
  }, [width]);

  useEffect(() => {
    if (isSingleView) {
      if (SingleViewData) setAdminLogs([SingleViewData]);

      return;
    }
    if (wasSingleView) {
      setAdminLogs([]);
      setWasSingleView(false);
      return;
    }
    if (adminLogData && adminLogData.length > 0) {
      const temp = [...adminLogData];
      const data = adminLogs.map((x) => {
        const found = temp.findIndex((y) => y.id === x.id);
        if (found > -1) {
          return temp.splice(found, 1)[0];
        }

        return x;
      });
      setAdminLogs([...data, ...temp].filter((x) => x !== undefined));
    } else if (!adminLogData) {
      fetchMore({
        id: undefined,
        communities: filter.map((x) => x.community.id),
      });
    }
  }, [adminLogData, isSingleView, SingleViewData, wasSingleView]);

  useEffect(() => {
    if (hasError()) setAlert({ state: "error", text: "Something went wrong!" });
  }, [hasError]);

  useEffect(() => {
    setInterval(() => {
      fetchMore({
        id: undefined,
        communities: filter.map((x) => x.community.id),
      });
    }, 1000 * 60 * 2);
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        scrollBehavior: "smooth",
        overflowY: "scroll",
      }}
      onScroll={handleScroll}
    >
      {adminData ? (
        [...adminData].map((entry) => (
          <AdminLogEntry
            key={"AdminEntry-" + entry.entry.post.id}
            data={entry}
            onAction={onAction}
            sx={{
              ...props,
              transform: `translateX(-${props?.ml.replace("%", "") || "50"}% )`,
              mb: "10px",
            }}
            hidePicture={true}
          />
        ))
      ) : (
        <></>
      )}
      {adminData.length !== (adminLogs?.length || adminData.length) &&
      !isSingleView ? (
        <Box
          sx={{
            width: "100%",
          }}
        >
          <Button
            sx={{
              ml: "50%",
              transform: "translateX(-50%)",
              width: "50%",
              mb: "10px",
            }}
            onClick={() => {
              adminLogs &&
                fetchMore({
                  id: adminLogs[adminLogs.length - 1].id,
                  communities: filter.map((x) => x.community.id),
                });
            }}
          >
            Load More
          </Button>
        </Box>
      ) : (
        <></>
      )}
      {isSingleView ? (
        <></>
      ) : (
        <Box
          sx={{
            position: "fixed",

            top: "5px",
            right: "25px",
            p: "5px",
            maxWidth: width > 1500 ? "100%" : "250px",
            borderRadius: "10px",
            backgroundColor: "rgba(0,0,0,0.75)",
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              flexDirection: "row",
              flexWrap: "wrap",
            }}
          >
            <FormControlLabel
              control={<Switch />}
              onChange={(ev, checked) => {
                handleShowOnlyOpenTasks(checked);
              }}
              checked={showOnlyOpenTasks}
              label="Show only Open Tasks"
            />

            <FormControlLabel
              control={<Switch />}
              onChange={(ev, checked) => {
                dispatch(setSpotlight(checked));
              }}
              checked={spotlight}
              label="Enable Spotlight"
            />
          </Box>
          <Box
            sx={{
              width: "100%",
            }}
          >
            <Button
              sx={{
                width: "100%",
                mt: "10px",
                height: "25px",
              }}
              variant="outlined"
              onClick={() => {
                dispatch(logoutUser());
              }}
            >
              Logout
            </Button>
          </Box>

          <Button
            sx={{
              height: "25px",
              mt: "10px",
              width: "100%",
            }}
            onClick={() => {
              setFilterOpen(!filterOpen);
            }}
          >
            {filterOpen ? "Close " : "Open "} Filters
          </Button>
          <Collapse in={filterOpen}>
            <Box
              sx={{
                pl: "10px",
                maxHeight: "400px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {availableCommunities.map((x) => (
                <FormControlLabel
                  key={"filter" + x.id}
                  control={<Switch />}
                  checked={filter.some((y) => y.community.id === x.id)}
                  onChange={(ev, checked) => {
                    if (checked) {
                      setFilter([...filter, { community: x }]);
                    } else {
                      setFilter(filter.filter((y) => y.community.id !== x.id));
                    }
                  }}
                  label={x.name}
                ></FormControlLabel>
              ))}
            </Box>
          </Collapse>
        </Box>
      )}
      <Portal>
        <Snackbar
          open={alert !== undefined}
          autoHideDuration={6000}
          onClose={() => setAlert(undefined)}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <Alert
            onClose={() => setAlert(undefined)}
            severity={alert?.state}
            sx={{ width: "100%" }}
          >
            {alert?.text}
          </Alert>
        </Snackbar>
      </Portal>
    </Box>
  );
};
